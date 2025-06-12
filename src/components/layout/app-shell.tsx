
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNavItems } from './sidebar-nav-items';
import { AppHeader } from './app-header';
import { LayoutGrid } from 'lucide-react';
import { MobileBottomNav } from './mobile-bottom-nav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
               {/* Desktop sidebar toggle, visible in sidebar header */}
               <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground p-1">
                 <LayoutGrid className="h-5 w-5" />
               </SidebarTrigger>
               {/* Title, hidden when sidebar is collapsed on desktop */}
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
          {/* The main page content (children) will be rendered below the AppHeader */}
          {children}
        </SidebarInset>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
