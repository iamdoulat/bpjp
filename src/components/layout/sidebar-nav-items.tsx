
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
  UserPlus as UserPlusIcon, // Renamed to avoid conflict
  History as HistoryIcon, // Added for My Donations
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone, requiresAuth: false }, // Assuming browse campaigns is public
];

const authenticatedNavItems = [
  { href: '/my-donations', label: 'My Donations', icon: HistoryIcon, requiresAuth: true }, // Updated icon
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
];

const adminNavItems = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true, isAdmin: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true, isAdmin: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true, isAdmin: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true, isAdmin: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true, isAdmin: true }, // Admin can create campaigns
];

const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Read admin email from environment variable
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminUser = user && user.email === adminEmail;

  const getNavItems = () => {
    if (loading) return [];
    
    let items = [...baseNavItems.filter(item => !item.requiresAuth || (item.requiresAuth && user))];
    
    if (user) {
      // Add authenticated items, ensuring they aren't already there (e.g. if one was made public)
      authenticatedNavItems.forEach(authItem => {
        if (!items.some(existing => existing.href === authItem.href)) {
          items.push(authItem);
        }
      });
      
      if (isAdminUser) { 
        adminNavItems.forEach(adminItem => {
            if (!items.some(existing => existing.href === adminItem.href)) {
                items.push(adminItem);
            }
        });
      }
    } else {
      items = items.concat(unauthenticatedNavItems);
    }

    // Ensure correct order: Dashboard, Browse, My Donations, Profile, then Admin or Login/Signup
    const desiredOrder = [
        '/', '/campaigns', '/my-donations', '/profile', 
        '/admin/overview', '/admin/users', '/admin/payments', '/admin/campaigns', '/new-campaign',
        '/login', '/signup'
    ];
    
    items.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.href);
        const indexB = desiredOrder.indexOf(b.href);
        if (indexA === -1) return 1; // Put unknown items at the end
        if (indexB === -1) return -1;
        return indexA - indexB;
    });


    // Filter out admin items if not admin, even if user is present (covers edge cases)
    if (user && !isAdminUser) {
        items = items.filter(item => !item.isAdmin);
    }
    // Ensure only truly public items or auth-related items show if no user
    if (!user) {
        items = items.filter(item => !item.requiresAuth || item.href === '/login' || item.href === '/signup');
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

