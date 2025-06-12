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
      if (currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/campaigns')) {
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
            <div className="flex items-center justify-between w-full gap-3">
              {/* Wrapper for Logo and App Name - hides when sidebar is collapsed */}
              <div className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
                <Link href="/" passHref>
                  <div className="flex items-center gap-2 cursor-pointer">
                    {appLogoUrl ? (
                      <Image src={appLogoUrl} alt="BPJP Logo" width={28} height={28} className="h-7 w-7 rounded" data-ai-hint="logo company" />
                    ) : (
                      <LayoutGrid className="h-7 w-7 text-sidebar-foreground" />
                    )}
                    <h1 className="text-xl font-headline font-semibold text-sidebar-foreground truncate">
                      BPJP
                    </h1>
                  </div>
                </Link>
              </div>

              {/* Sidebar Trigger Button for desktop - remains visible to toggle */}
              <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground p-1">
                {/* PanelLeft icon is default from SidebarTrigger component */}
              </SidebarTrigger>
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
