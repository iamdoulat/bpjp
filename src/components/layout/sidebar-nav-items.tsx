// src/components/layout/sidebar-nav-items.tsx
"use client";

import Link from 'next/link';
import * as React from 'react';
import {
  LayoutDashboard, Megaphone, UserCircle2, ShieldCheck, Users,
  CreditCard, ClipboardList, PlusCircle, LogIn, UserPlus as UserPlusIcon,
  History as HistoryIcon, ReceiptText, FilePlus2, CalendarCheck2, CalendarPlus,
  Settings, Info, Target, FileEdit, ListChecks, Landmark // Using Landmark as a generic fallback
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

// Defined navigation lists based on user's request
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
  { href: '/admin/mission/edit', label: 'Edit Mission Page', icon: FileEdit },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

// For unauthenticated users - public pages from the general list + auth actions
const publicPagesForUnauthenticated: NavItem[] = [
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone },
  { href: '/our-mission', label: 'Our Mission', icon: Target },
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2 },
  { href: '/about-us', label: 'About Us', icon: Info },
  { href: '/donors-list', label: 'Donors List', icon: Users },
];

const authActionPages: NavItem[] = [
  { href: '/login', label: 'Login', icon: LogIn },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon },
];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Simplified admin check for now. Actual role checking should be more robust.
  const isPotentiallyAdmin = !!user; 

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
    // Authenticated users see all generalNavLinks
    generalNavLinks.forEach(item => itemsToRender.push(item));
    // If potentially admin, prepare admin links
    if (isPotentiallyAdmin) {
      adminNavLinks.forEach(item => adminItemsToRender.push(item));
    }
  } else {
    // Unauthenticated users see public pages and auth actions
    publicPagesForUnauthenticated.forEach(item => itemsToRender.push(item));
    authActionPages.forEach(item => itemsToRender.push(item));
  }
  
  const renderItem = (item: NavItem) => (
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

  return (
    <SidebarMenu>
      {itemsToRender.map(renderItem)}
      {adminItemsToRender.length > 0 && ( // Only show admin section if there are admin items
        <>
          <SidebarSeparator className="my-2" />
          <li className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden tracking-wider uppercase">
            Administration
          </li>
          {adminItemsToRender.map(renderItem)}
        </>
      )}
    </SidebarMenu>
  );
}
