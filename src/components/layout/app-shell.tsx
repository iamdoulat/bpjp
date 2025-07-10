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
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react'; // Added useRef
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface AppShellProps {
  children: ReactNode;
}

const adminOnlyPaths = [
  '/admin/overview',
  '/new-campaign',
  '/admin/campaigns', // covers /edit, /view subpaths
  '/admin/payments',
  '/admin/users',
  '/admin/expenses/create',
  '/expenses/history-list',
  '/admin/events/create',
  '/admin/events', // covers /edit, /view, /registrations subpaths
  '/admin/mission/edit',
  '/admin/notice',
  '/admin/settings',
  '/admin/election-vote', // Covers subpaths like /results, /candidate-management
];

const publicPaths = [
  '/login',
  '/signup',
  '/campaigns', // Main listing page
  '/notices', // Public notices page
  '/our-mission',
  '/about-us',
  '/upcoming-events', // Main listing page
  '/donors-list',
  '/election-vote', // Public voting page
  '/', // Homepage (page.tsx handles its own auth redirect for unauthenticated)
];

const publicPathPrefixes = [
  '/campaigns/view/', // Dynamic campaign view
  '/upcoming-events/view/', // Dynamic event view
];


export function AppShell({ children }: AppShellProps) {
  const { user, loading, isAdmin } = useAuth();
  const { appName } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const mainScrollRef = useRef<HTMLDivElement>(null); // Ref for the main scrollable area

  useEffect(() => {
    if (loading) {
      return; 
    }

    const isCurrentPathPublic = publicPaths.includes(pathname) || publicPathPrefixes.some(prefix => pathname.startsWith(prefix));
    const isCurrentPathAdmin = adminOnlyPaths.some(adminPath => pathname.startsWith(adminPath));

    if (!user) { 
      if (!isCurrentPathPublic) {
        router.push('/login');
      }
    } else { 
      if (isCurrentPathAdmin && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        router.push('/'); 
      }
    }
  }, [user, loading, isAdmin, router, pathname, toast]);

  // Scroll to bottom on component mount (after page load/refresh) or when pathname changes
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    if (mainEl) {
      const timer = setTimeout(() => {
        mainEl.scrollTo({
          top: mainEl.scrollHeight,
          behavior: 'smooth'
        });
      }, 300); // Delay to allow content rendering

      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [pathname]); // Runs on mount and when pathname changes


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
          <SidebarHeader className="h-14 px-4 border-b border-sidebar-border flex items-center">
            <div className="flex items-center justify-between w-full gap-3">
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
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <div 
            ref={mainScrollRef} // Assign ref here
            className="flex-1 overflow-auto"
          >
            {children}
          </div>
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
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
