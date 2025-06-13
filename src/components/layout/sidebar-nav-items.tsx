
// src/components/layout/sidebar-nav-items.tsx
"use client";

import Link from 'next/link';
import * as React from 'react';
import {
  LayoutDashboard,
  Megaphone,
  UserCircle2,
  ShieldCheck,
  Users,
  CreditCard,
  ClipboardList,
  PlusCircle,
  LogIn,
  UserPlus as UserPlusIcon,
  History as HistoryIcon,
  ReceiptText,
  FilePlus2,
  CalendarCheck2,
  CalendarPlus,
  Settings,
  Info,
  Target,
  FileEdit,
  // ChevronRight, // No longer needed for accordion
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
// import { cn } from '@/lib/utils'; // cn might not be needed if accordion is removed

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone, requiresAuth: false },
  { href: '/our-mission', label: 'Our Mission', icon: Target, requiresAuth: false },
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2, requiresAuth: false },
  { href: '/about-us', label: 'About Us', icon: Info, requiresAuth: false },
];

const authenticatedUserItems = [
  { href: '/my-donations', label: 'My Donations', icon: HistoryIcon, requiresAuth: true },
  { href: '/donors-list', label: 'Donors List', icon: Users, requiresAuth: false },
  { href: '/expenses/history', label: 'Expenses History', icon: ReceiptText, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
];

// Former admin items, now available to all authenticated users for navigation
const formerlyAdminNavItems = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true },
  { href: '/admin/expenses/create', label: 'Create Expense', icon: FilePlus2, requiresAuth: true },
  { href: '/admin/events/create', label: 'Create Event', icon: CalendarPlus, requiresAuth: true },
  { href: '/admin/mission/edit', label: 'Edit Mission Page', icon: FileEdit, requiresAuth: true },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings, requiresAuth: true }, // Renamed for clarity
];

const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // The adminEmail check can still be useful for other UI elements or conditional logic
  // within pages, but it won't gate sidebar item visibility here.
  // const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // const isAdminUser = user && user.email === adminEmail;

  const getNavItemsToDisplay = () => {
    if (loading) return [];

    let items = [];

    if (user) {
      // All authenticated users see these items
      items = [
        ...baseNavItems.filter(item => item.requiresAuth), // Dashboard
        ...authenticatedUserItems,
        ...formerlyAdminNavItems, // Former admin items are now here
      ];
      // Add public base items not already included (like Browse Campaigns if requiresAuth was changed)
      baseNavItems.forEach(baseItem => {
        if (!baseItem.requiresAuth && !items.some(i => i.href === baseItem.href)) {
            items.push(baseItem);
        }
      });
      // Add public items from authenticatedUserItems (like Donors List)
       authenticatedUserItems.forEach(authItem => {
        if (!authItem.requiresAuth && !items.some(i => i.href === authItem.href)) {
            items.push(authItem);
        }
      });


    } else {
      // Unauthenticated users
      items = [
        ...baseNavItems.filter(item => !item.requiresAuth),
        ...authenticatedUserItems.filter(item => !item.requiresAuth), // e.g. Donors List
        ...unauthenticatedNavItems,
      ];
    }
    
    // Define a general desired order for all items
    // Items not in this list will be appended at the end based on their original array order
    const desiredOrder = [
        '/',                 // Dashboard
        '/my-donations',
        '/profile',
        // Campaigns & Creation
        '/campaigns',        // Browse Campaigns
        '/new-campaign',     // Create Campaign (now visible to all logged-in)
        // Management (formerly admin, now for all logged-in)
        '/admin/overview',
        '/admin/campaigns',  // Manage Campaigns
        '/admin/payments',
        '/admin/users',
        '/admin/expenses/create',
        '/admin/events/create',
        // Content & Settings (formerly admin, now for all logged-in)
        '/admin/mission/edit',
        '/admin/settings',   // Platform Settings
        // Public / General Info
        '/donors-list',
        '/expenses/history', // This was in authenticated, might be more general or specific
        '/upcoming-events',
        '/our-mission',
        '/about-us',
        // Auth
        '/login',
        '/signup'
    ];

    items.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.href);
        const indexB = desiredOrder.indexOf(b.href);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both in desired order
        if (indexA !== -1) return -1; // A is in order, B is not
        if (indexB !== -1) return 1;  // B is in order, A is not
        return 0; // Neither in desired order, maintain relative original order
    });
    
    // Remove duplicates that might arise from different lists having same href
    const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.href === item.href
        ))
    );

    return uniqueItems;
  };

  const navItemsToDisplay = getNavItemsToDisplay();

  if (loading) {
    return (
      <SidebarMenu>
        {[...Array(15)].map((_, i) => ( // Increased skeleton items
          <SidebarMenuItem key={i}>
             <div className="flex items-center gap-2 p-2 w-full">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-3/4" />
              </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      {navItemsToDisplay.map((item) => {
        // Skip rendering if item is undefined or has no href (shouldn't happen with current setup)
        if (!item || !item.href) return null;

        // All items are now direct menu items
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

