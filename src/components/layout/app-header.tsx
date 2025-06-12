// src/components/layout/app-header.tsx
import {
  Handshake,
  Moon,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2"> {/* Left items container */}
          <SidebarTrigger className="md:hidden" />
          {/* App Logo & Title - shown on mobile OR when desktop sidebar is collapsed */}
          <div className="hidden items-center gap-2 md:flex group-data-[sidebar-collapsible=icon]/sidebar-wrapper:md:hidden group-data-[sidebar-state=expanded]/sidebar-wrapper:md:hidden">
            <Handshake className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">ImpactBoard</span>
          </div>
        </div>

        <div className="flex items-center gap-3"> {/* Right items container */}
          {/* Theme Toggle Button */}
          <Button variant="ghost" size="icon" aria-label="Toggle Theme" className="h-9 w-9">
            <Moon className="h-5 w-5" />
          </Button>
          {/* Notifications */}
          <Button variant="ghost" size="icon" aria-label="Notifications" className="h-9 w-9 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
          </Button>
          {/* User Avatar */}
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="profile person" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
