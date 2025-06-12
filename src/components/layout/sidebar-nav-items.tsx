
"use client";

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
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone }, // Example, adjust if needed
  { href: '/my-donations', label: 'My Donations', icon: HeartHandshake }, // Example, adjust if needed
  { href: '/profile', label: 'Profile', icon: UserCircle2 }, // Example, adjust if needed
  { href: '/admin/overview', label: 'Admin Overview', icon: ShieldCheck }, // Example, adjust if needed
  { href: '/admin/users', label: 'Manage Users', icon: Users }, // Example, adjust if needed
  { href: '/admin/payments', label: 'Track Payments', icon: CreditCard }, // Example, adjust if needed
  { href: '/admin/campaigns', label: 'Manage Campaigns', icon: ClipboardList }, // Example, adjust if needed
  { href: '/new-campaign', label: 'New Campaign', icon: PlusCircle }, // Ensures this links to the new page
];

export function SidebarNavItems() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            href={item.href}
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
