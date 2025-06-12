import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNavItems } from './sidebar-nav-items';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
               <h1 className="text-2xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">ImpactBoard</h1>
               <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNavItems />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1">
          <div className="md:hidden p-4"> 
            <SidebarTrigger />
          </div>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
