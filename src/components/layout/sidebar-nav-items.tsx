
// src/components/layout/sidebar-nav-items.tsx
"use client";

import Link from 'next/link';
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
  CalendarCheck2, // Added for Upcoming Events
  CalendarPlus,   // Added for Create Event
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/campaigns', label: 'Browse Campaigns', icon: Megaphone, requiresAuth: false }, 
  { href: '/upcoming-events', label: 'Upcoming Events', icon: CalendarCheck2, requiresAuth: false }, // Added
];

const authenticatedNavItems = [
  { href: '/my-donations', label: 'My Donations', icon: HistoryIcon, requiresAuth: true },
  { href: '/expenses/history', label: 'Expenses History', icon: ReceiptText, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: UserCircle2, requiresAuth: true },
];

const adminNavItems = [
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck, requiresAuth: true, isAdmin: true },
  { href: '/admin/users', label: 'Manage Users', icon: Users, requiresAuth: true, isAdmin: true },
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard, requiresAuth: true, isAdmin: true },
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList, requiresAuth: true, isAdmin: true },
  { href: '/new-campaign', label: 'Create Campaign', icon: PlusCircle, requiresAuth: true, isAdmin: true },
  { href: '/admin/expenses/create', label: 'Create Expense', icon: FilePlus2, requiresAuth: true, isAdmin: true },
  { href: '/admin/events/create', label: 'Create Event', icon: CalendarPlus, requiresAuth: true, isAdmin: true }, // Added
];

const unauthenticatedNavItems = [
  { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  { href: '/signup', label: 'Sign Up', icon: UserPlusIcon, requiresAuth: false },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminUser = user && user.email === adminEmail;

  const getNavItems = () => {
    if (loading) return [];
    
    let items = [...baseNavItems.filter(item => !item.requiresAuth || (item.requiresAuth && user))];
    
    if (user) {
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

    const desiredOrder = [
        '/', '/campaigns', '/upcoming-events', '/my-donations', '/expenses/history', '/profile', 
        '/admin/overview', '/admin/users', '/admin/payments', '/admin/campaigns', 
        '/new-campaign', '/admin/expenses/create', '/admin/events/create',
        '/login', '/signup'
    ];
    
    items.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.href);
        const indexB = desiredOrder.indexOf(b.href);
        if (indexA === -1) return 1; 
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    if (user && !isAdminUser) {
        items = items.filter(item => !item.isAdmin);
    }
    if (!user) {
        items = items.filter(item => !item.requiresAuth || item.href === '/login' || item.href === '/signup' || item.href === '/campaigns' || item.href === '/upcoming-events');
    }


    return items;
  };

  const navItems = getNavItems();

  if (loading) {
    return (
      <SidebarMenu>
        {[...Array(7)].map((_, i) => ( // Increased skeleton items for new links
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
