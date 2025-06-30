// src/components/layout/mobile-bottom-nav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  History,
  UserCircle2,
  Users,
  CalendarCheck2,
  LogIn,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const authenticatedNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/my-donations', label: 'Donations', icon: History },
  { href: '/profile', label: 'Profile', icon: UserCircle2 },
];

const unauthenticatedNavItems = [
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/upcoming-events', label: 'Events', icon: CalendarCheck2 },
  { href: '/about-us', label: 'About', icon: Info },
  { href: '/executive-committee', label: 'Committee', icon: Users },
  { href: '/login', label: 'Login', icon: LogIn },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Hide nav while loading to prevent flicker
  if (loading) {
    return null;
  }

  const navItems = user ? authenticatedNavItems : unauthenticatedNavItems;
  
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40 h-16 border rounded-lg bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          let displayLabel = item.label;
          // Shorten labels slightly for mobile if needed
          if (item.label === "My Donations") displayLabel = "Donations";
          if (item.label === "Upcoming Events") displayLabel = "Events";
          if (item.label === "Executive Committee") displayLabel = "Committee";
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center space-y-1 p-2 text-xs',
                !isActive && 'text-muted-foreground hover:text-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-accent')} />
              <span className={cn(isActive ? 'font-bold text-foreground' : '')}>{displayLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
