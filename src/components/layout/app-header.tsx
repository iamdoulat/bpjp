// src/components/layout/app-header.tsx
import {
  Handshake,
  Moon,
  Bell,
  PanelLeft,
  PlusCircle,
  Save,
  Share2,
  Printer,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Search,
  Maximize2,
  UserCog,
  Settings2,
  LogOut,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

function HeaderMenubar() {
  return (
    <Menubar className="hidden md:flex rounded-none border-none bg-transparent h-auto p-0 ml-4">
      <MenubarMenu>
        <MenubarTrigger className="h-9 px-3 py-2 text-sm">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <PlusCircle className="mr-2 h-4 w-4" /> New Project <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Save className="mr-2 h-4 w-4" /> Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Printer className="mr-2 h-4 w-4" /> Print... <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="h-9 px-3 py-2 text-sm">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Undo2 className="mr-2 h-4 w-4" /> Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Redo2 className="mr-2 h-4 w-4" /> Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Scissors className="mr-2 h-4 w-4" /> Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Copy className="mr-2 h-4 w-4" /> Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <ClipboardPaste className="mr-2 h-4 w-4" /> Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
           <MenubarItem>
            <Search className="mr-2 h-4 w-4" /> Find... <MenubarShortcut>⌘F</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="h-9 px-3 py-2 text-sm">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Maximize2 className="mr-2 h-4 w-4" /> Full Screen
          </MenubarItem>
          <MenubarItem>
            Toggle Sidebar <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="h-9 px-3 py-2 text-sm">Account</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <UserCog className="mr-2 h-4 w-4" /> Profile
          </MenubarItem>
          <MenubarItem>
            <Settings2 className="mr-2 h-4 w-4" /> Settings
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
       <MenubarMenu>
        <MenubarTrigger className="h-9 px-3 py-2 text-sm">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <HelpCircle className="mr-2 h-4 w-4" /> Documentation
          </MenubarItem>
          <MenubarItem>
            <LifeBuoy className="mr-2 h-4 w-4" /> Support
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}


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
          
          <HeaderMenubar /> {/* Menubar added here */}
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
