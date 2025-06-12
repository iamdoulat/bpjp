
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
  ChevronRight, // Added ChevronRight
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone, requiresAuth: false },
  { href: '/our-mission', label: 'Our Mission', icon: Target, requiresAuth: false },
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2, requiresAuth: false },
  { href: '/about-us', label: 'About Us', icon: Info, requiresAuth: false },
];

const authenticatedNavItems = [
  { href: '/my-donations', label: 'My Donations', icon: HistoryIcon, requiresAuth: true },
  { href: '/expenses/history', label: 'Expenses History', icon: ReceiptText, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
];

const adminSubNavItems = [ // Renamed from adminNavItems to distinguish from the toggle
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true, isAdmin: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true, isAdmin: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true, isAdmin: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true, isAdmin: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true, isAdmin: true },
  { href: '/admin/expenses/create', label: 'Create Expense', icon: FilePlus2, requiresAuth: true, isAdmin: true },
  { href: '/admin/events/create', label: 'Create Event', icon: CalendarPlus, requiresAuth: true, isAdmin: true },
  { href: '/admin/mission/edit', label: 'Edit Mission Page', icon: FileEdit, requiresAuth: true, isAdmin: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, requiresAuth: true, isAdmin: true },
];

const adminAccordionToggleItem = {
  id: 'admin-accordion-toggle', // Unique ID for this item
  label: 'Administration',
  icon: ShieldCheck,
  requiresAuth: true,
  isAdmin: true,
  href: '#admin-accordion', // Dummy href for sorting/key, not a real link
};


const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminUser = user && user.email === adminEmail;

  const isAdminPath = pathname.startsWith('/admin/');
  const [isAdminSectionOpen, setIsAdminSectionOpen] = React.useState(isAdminPath);

  React.useEffect(() => {
    if (isAdminPath) {
      setIsAdminSectionOpen(true);
    }
  }, [pathname, isAdminPath]);

  const getNavItemsToDisplay = () => {
    if (loading) return [];

    let items = [...baseNavItems.filter(item => !item.requiresAuth || (item.requiresAuth && user))];

    if (user) {
      authenticatedNavItems.forEach(authItem => {
        if (!items.some(existing => existing.href === authItem.href)) {
          items.push(authItem);
        }
      });

      if (isAdminUser) {
        // Add the admin accordion toggle instead of individual admin items
        if (!items.some(existing => existing.id === adminAccordionToggleItem.id)) {
          items.push(adminAccordionToggleItem as any); // Cast as any to fit existing type temporarily
        }
      }
    } else {
      items = items.filter(item => !item.requiresAuth);
      items = items.concat(unauthenticatedNavItems);
    }

    const desiredOrder = [
        '/',                 // Dashboard
        '/my-donations',
        '/campaigns',        // Browse Campaigns
        '/upcoming-events',
        '/expenses/history',
        '/our-mission',      // Moved here
        '/about-us',         // Moved here
        '/profile',          // Profile is after About Us
        adminAccordionToggleItem.href, // Position for the admin accordion toggle
        '/login',
        '/signup'
    ];

    items.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.href);
        const indexB = desiredOrder.indexOf(b.href);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    // If user is logged in but not admin, filter out any admin-only items (like the toggle)
    if (user && !isAdminUser) {
        items = items.filter(item => !item.isAdmin);
    }
    
    if (!user) {
        items = items.filter(item =>
            !item.requiresAuth ||
            item.href === '/login' ||
            item.href === '/signup' ||
            baseNavItems.some(baseItem => baseItem.href === item.href && !baseItem.requiresAuth)
        );
    }

    return items;
  };

  const navItemsToDisplay = getNavItemsToDisplay();

  if (loading) {
    return (
      <SidebarMenu>
        {[...Array(11)].map((_, i) => (
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
        if (item.id === adminAccordionToggleItem.id) {
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => setIsAdminSectionOpen(!isAdminSectionOpen)}
                isActive={isAdminPath && isAdminSectionOpen} // Highlight if an admin page is active and section is open
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
                <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform duration-200", isAdminSectionOpen && "rotate-90")} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }
        return (
          <SidebarMenuItem key={item.href || item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
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

      {isAdminUser && isAdminSectionOpen && (
        <div className="pt-1 pl-3 space-y-1"> {/* Indentation for sub-items */}
          {adminSubNavItems.map((subItem) => (
             <SidebarMenuItem key={subItem.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === subItem.href}
                  tooltip={subItem.label}
                  size="sm" // Make sub-items slightly smaller
                  className="pl-3" // Additional padding for visual nesting
                >
                  <Link href={subItem.href}>
                    <subItem.icon />
                    <span>{subItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          ))}
        </div>
      )}
    </SidebarMenu>
  );
}
