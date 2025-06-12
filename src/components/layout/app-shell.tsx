// src/components/layout/app-shell.tsx
"use client";

import type { ReactNode } from 'react';
import Image from 'next/image'; // Import Image
import Link from 'next/link'; // Import Link
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
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/campaigns')) { // Allow /campaigns and its sub-paths
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
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
               <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground p-1">
                {/* Show LayoutGrid only if there's no app logo to avoid duplication when sidebar is collapsed */}
                {!appLogoUrl && <LayoutGrid className="h-5 w-5" />}
                {appLogoUrl && <span className="group-data-[state=collapsed]:hidden"><LayoutGrid className="h-5 w-5" /></span>}
               </SidebarTrigger>
              {appLogoUrl ? (
                <Link href="/" passHref>
                  <div className="flex items-center gap-2 cursor-pointer group-data-[state=collapsed]:hidden">
                    <Image src={appLogoUrl} alt="ImpactBoard Logo" width={28} height={28} className="h-7 w-7 rounded" data-ai-hint="logo company" />
                    <h1 className="text-xl font-headline font-semibold text-sidebar-foreground truncate">
                      ImpactBoard
                    </h1>
                  </div>
                </Link>
              ) : (
                 <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[state=collapsed]:hidden truncate">
                   ImpactBoard
                 </h1>
              )}
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
        {user && <MobileBottomNav /> }
      </div>
    </SidebarProvider>
  );
}
