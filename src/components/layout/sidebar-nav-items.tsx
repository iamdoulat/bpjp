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
  ListChecks, // Added ListChecks
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

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
  { href: '/expenses/history-list', label: 'Expenses History List', icon: ListChecks, requiresAuth: true }, // New item
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
];

const formerlyAdminNavItems = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true },
  { href: '/admin/expenses/create', label: 'Create Expense', icon: FilePlus2, requiresAuth: true },
  { href: '/admin/events/create', label: 'Create Event', icon: CalendarPlus, requiresAuth: true },
  { href: '/admin/mission/edit', label: 'Edit Mission Page', icon: FileEdit, requiresAuth: true },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings, requiresAuth: true },
];

const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const getNavItemsToDisplay = () => {
    if (loading) return [];

    let items = [];

    if (user) {
      items = [
        ...baseNavItems.filter(item => item.requiresAuth), 
        ...authenticatedUserItems,
        ...formerlyAdminNavItems, 
      ];
      baseNavItems.forEach(baseItem => {
        if (!baseItem.requiresAuth && !items.some(i => i.href === baseItem.href)) {
            items.push(baseItem);
        }
      });
       authenticatedUserItems.forEach(authItem => {
        if (!authItem.requiresAuth && !items.some(i => i.href === authItem.href)) {
            items.push(authItem);
        }
      });
    } else {
      items = [
        ...baseNavItems.filter(item => !item.requiresAuth),
        ...authenticatedUserItems.filter(item => !item.requiresAuth),
        ...unauthenticatedNavItems,
      ];
    }
    
    const desiredOrder = [
        '/',                 
        '/my-donations',
        '/profile',
        '/campaigns',        
        '/new-campaign',     
        '/admin/overview',
        '/admin/campaigns',  
        '/admin/payments',
        '/admin/users',
        '/admin/expenses/create',
        '/expenses/history',
        '/expenses/history-list', // Added here
        '/admin/events/create',
        '/admin/mission/edit',
        '/admin/settings',   
        '/donors-list',
        '/upcoming-events',
        '/our-mission',
        '/about-us',
        '/login',
        '/signup'
    ];

    items.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.href);
        const indexB = desiredOrder.indexOf(b.href);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB; 
        if (indexA !== -1) return -1; 
        if (indexB !== -1) return 1;  
        return 0; 
    });
    
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
        {[...Array(16)].map((_, i) => ( // Increased skeleton items
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
        if (!item || !item.href) return null;
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
