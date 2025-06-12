// src/components/layout/sidebar-nav-items.tsx
"use client";

import Link from 'next/link';
import {
  LayoutDashboard,
  Megaphone,
  HeartHandshake,
  UserCircle2,
  ShieldCheck,
  Users,
  CreditCard,
  ClipboardList,
  PlusCircle,
  LogIn,
  UserPlus as UserPlusIcon // Renamed to avoid conflict
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone, requiresAuth: false },
];

const authenticatedNavItems = [
  { href: '/my-donations', label: 'My Donations', icon: HeartHandshake, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true },
];

const adminNavItems = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true, isAdmin: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true, isAdmin: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true, isAdmin: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true, isAdmin: true },
];

const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  // Placeholder for admin check, replace with actual logic if available
  const isAdminUser = user && (user.email === 'admin@example.com'); // Example admin check

  const getNavItems = () => {
    if (loading) return [];
    
    let items = [...baseNavItems.filter(item => !item.requiresAuth || (item.requiresAuth && user))];
    
    if (user) {
      items = items.concat(authenticatedNavItems);
      if (isAdminUser) { // Assuming you have a way to check if user is admin
        items = items.concat(adminNavItems);
      }
    } else {
      items = items.concat(unauthenticatedNavItems);
    }
    return items;
  };

  const navItems = getNavItems();

  if (loading) {
    return (
      <SidebarMenu>
        {[...Array(5)].map((_, i) => (
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
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
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
      ))}
    </SidebarMenu>
  );
}
