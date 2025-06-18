
// src/components/layout/sidebar-nav-items.tsx
"use client";

import Link from 'next/link';
import * as React from 'react';
import {
  LayoutDashboard, Megaphone, UserCircle2, ShieldCheck, Users,
  CreditCard, ClipboardList, PlusCircle, LogIn, UserPlus as UserPlusIcon,
  History as HistoryIcon, ReceiptText, FilePlus2, CalendarCheck2, CalendarPlus,
  Settings, Info, Target, FileEdit, ListChecks, Landmark, CalendarDays
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const generalNavLinks: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone },
  { href: '/my-donations', label: 'My Donations', icon: HistoryIcon },
  { href: '/donors-list', label: 'Donors List', icon: Users },
  { href: '/expenses/history', label: 'Expenses History', icon: ReceiptText },
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2 },
  { href: '/our-mission', label: 'Our Mission', icon: Target },
  { href: '/about-us', label: 'About Us', icon: Info },
  { href: '/profile', label: 'Profile', icon: UserCircle2 },
];

const adminNavLinks: NavItem[] = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard },
  { href: '/admin/users', label: 'Manage Users', icon: Users },
  { href: '/admin/expenses/create', label: 'Create Expense', icon: FilePlus2 },
  { href: '/expenses/history-list', label: 'Expenses History List', icon: ListChecks },
  { href: '/admin/events/create', label: 'Create Event', icon: CalendarPlus },
  { href: '/admin/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/admin/mission/edit', label: 'Manage Mission Page', icon: FileEdit },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

const publicPagesForUnauthenticated: NavItem[] = [
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone },
  { href: '/our-mission', label: 'Our Mission', icon: Target },
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2 },
  { href: '/about-us', label: 'About Us', icon: Info },
  { href: '/donors-list', label: 'Donors List', icon: Users },
];

// authActionPages not actively used in rendering logic below, can be removed if not planned for other use
// const authActionPages: NavItem[] = [
//   { href: '/login', label: 'Login', icon: LogIn },
//   { href: '/signup', label: 'Sign Up', icon: UserPlusIcon },
// ];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth(); 
  
  if (loading) {
    return (
      <SidebarMenu>
        {[...Array(16)].map((_, i) => (
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

  const itemsToRender: NavItem[] = [];
  const adminItemsToRender: NavItem[] = [];

  if (user) {
    generalNavLinks.forEach(item => itemsToRender.push(item));
    if (isAdmin) { 
      adminNavLinks.forEach(item => adminItemsToRender.push(item));
    }
  } else {
    // For unauthenticated users, always add the login page as the first item if not already on login/signup
    if (pathname !== '/login' && pathname !== '/signup') {
      itemsToRender.push({ href: '/login', label: 'Login', icon: LogIn });
    }
    publicPagesForUnauthenticated.forEach(item => itemsToRender.push(item));
    // Only add signup if not on login/signup
     if (pathname !== '/login' && pathname !== '/signup') {
      itemsToRender.push({ href: '/signup', label: 'Sign Up', icon: UserPlusIcon });
    }
  }
  
  const renderItem = (item: NavItem, isLastAdminItem: boolean = false) => (
    <SidebarMenuItem 
        key={item.href} 
        className={cn(
            item.label === 'Profile' ? "mb-[10px]" : "",
            item.label === 'Platform Settings' && isLastAdminItem ? "mb-[15px]" : ""
        )}
    >
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href.split('/').length > 1)}
        tooltip={item.label}
      >
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <SidebarMenu>
      {itemsToRender.map((item) => renderItem(item))}
      {user && isAdmin && adminItemsToRender.length > 0 && ( 
        <>
          <SidebarSeparator className="my-2" />
          <li className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden tracking-wider uppercase">
            Administration
          </li>
          {adminItemsToRender.map((item, index) => renderItem(item, index === adminItemsToRender.length - 1))}
        </>
      )}
    </SidebarMenu>
  );
}
