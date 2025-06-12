// src/components/layout/app-shell.tsx
"use client";

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNavItems } from './sidebar-nav-items';
import { AppHeader } from './app-header';
import { LayoutGrid } from 'lucide-react';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // For loading state

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated and not loading,
  // and current page is not login/signup
  // This is a basic form of route protection. More robust solutions might use middleware.
  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
         // Commenting out redirect for now to allow viewing public pages like /campaigns
        // router.push('/login');
      }
    }
  }, [user, loading, router]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not logged in, we might render a simpler layout or just the children
  // (e.g., for public campaign browsing page which shouldn't have full AppShell)
  // For now, let's assume AppShell is primarily for authenticated users.
  // Public pages might need a different layout structure.
  // However, for simplicity, we render AppShell and rely on SidebarNavItems and AppHeader
  // to show appropriate content. Some pages might still be accessible.

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        {/* Sidebar is conditionally rendered or its content is conditional based on auth */}
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
               <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground p-1">
                 <LayoutGrid className="h-5 w-5" />
               </SidebarTrigger>
               <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[state=collapsed]:hidden truncate">
                 ImpactBoard
               </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNavItems />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          {children}
        </SidebarInset>
        {user && <MobileBottomNav /> } {/* Only show mobile nav if logged in */}
      </div>
    </SidebarProvider>
  );
}
