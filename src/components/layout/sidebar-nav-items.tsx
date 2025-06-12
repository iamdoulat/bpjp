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
// import { usePathname } from 'next/navigation'; // For active state based on path

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, active: true }, // Assuming '/' is dashboard
  { href: '#', label: 'Campaigns', icon: Megaphone },
  { href: '#', label: 'My Donations', icon: HeartHandshake },
  { href: '#', label: 'Profile', icon: UserCircle2 },
  { href: '#', label: 'Admin Overview', icon: ShieldCheck },
  { href: '#', label: 'Manage Users', icon: Users },
  { href: '#', label: 'Track Payments', icon: CreditCard },
  { href: '#', label: 'Manage Campaigns', icon: ClipboardList },
  { href: '#', label: 'New Campaign', icon: PlusCircle },
];

export function SidebarNavItems() {
  // const pathname = usePathname(); // Example for dynamic active state

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            href={item.href}
            isActive={item.active} // Replace with dynamic logic if needed: pathname === item.href
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
