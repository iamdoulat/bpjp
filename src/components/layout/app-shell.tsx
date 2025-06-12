// src/components/layout/app-shell.tsx
"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNavItems } from './sidebar-nav-items';
import { AppHeader } from './app-header';
import { LayoutGrid } from 'lucide-react';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const { appName } = useAppContext();
  const router = useRouter();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/campaigns') && currentPath !== '/our-mission' && currentPath !== '/about-us' && currentPath !== '/upcoming-events' && currentPath !== '/') {
        // router.push('/login'); // Allow certain public pages
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
            <div className="flex items-center justify-between w-full gap-3">
              {/* Left side: Logo - hides when sidebar is expanded on desktop */}
              <div className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
                <Link href="/" passHref>
                  <div className="flex items-center gap-2 cursor-pointer">
                    {appLogoUrl ? (
                      <Image src={appLogoUrl} alt={`${appName} Logo`} width={28} height={28} className="h-7 w-7 rounded" data-ai-hint="logo company" />
                    ) : (
                      <LayoutGrid className="h-7 w-7 text-sidebar-foreground" />
                    )}
                  </div>
                </Link>
              </div>
               {/* Standalone Logo/Icon for collapsed state on desktop - always visible if logo URL exists */}
               {appLogoUrl && (
                <div className="hidden group-data-[state=collapsed]:flex items-center">
                   <Link href="/" passHref>
                     <Image src={appLogoUrl} alt={`${appName} Logo (collapsed)`} width={28} height={28} className="h-7 w-7 rounded" data-ai-hint="logo company" />
                   </Link>
                </div>
               )}
               {!appLogoUrl && (
                 <div className="hidden group-data-[state=collapsed]:flex items-center">
                   <Link href="/" passHref>
                      <LayoutGrid className="h-7 w-7 text-sidebar-foreground" />
                   </Link>
                 </div>
               )}
              <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground p-1">
              </SidebarTrigger>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNavItems />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col"> {/* Main content area wrapper */}
          <AppHeader />
          <div className="flex-1 overflow-auto"> {/* This wrapper allows children to scroll */}
            {children}
          </div>
          {/* Desktop Footer - appears below the scrollable children */}
          <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border/40 hidden md:block">
            © 2025 - Designed and Developed by{' '}
            <a
              href="https://vcard.mddoulat.com/iamdoulat"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:underline text-foreground"
            >
              Doulat
            </a>{' '}
            v1.0
          </footer>
        </SidebarInset>
        {user && <MobileBottomNav />} {/* This is fixed, overlays everything at the bottom on mobile */}
      </div>
    </SidebarProvider>
  );
}
