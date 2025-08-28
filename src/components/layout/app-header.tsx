// src/components/layout/app-header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import {
  Moon,
  Sun,
  LogIn,
  LogOut,
  UserPlus,
  UserCircle2,
  LayoutDashboard
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

export function AppHeader() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { appName } = useAppContext();
  const router = useRouter();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
        const parts = name.split(" ");
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-header-background/95 backdrop-blur supports-[backdrop-filter]:bg-header-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2"> 
          {user && <SidebarTrigger className="md:hidden" /> }
          <div className="flex items-center gap-2 md:flex peer-data-[state=expanded]:md:hidden min-w-0">
            <Link href="/" passHref>
              <div className="flex items-center gap-2 cursor-pointer">
                {appLogoUrl && (
                  <Image src={appLogoUrl} alt={`${appName} Logo`} width={32} height={32} className="h-8 w-8 rounded flex-shrink-0" data-ai-hint="logo company" />
                )}
                <div className="font-semibold text-base md:text-lg text-foreground truncate">
                  <span className="md:hidden">BPJP</span>
                  <span className="hidden md:inline">{appName}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {loading && (
            <>
              <Skeleton className="h-9 w-9 rounded-full" />
            </>
          )}

          {!loading && user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png?text=${getInitials(user.displayName, user.email)}`} alt={user.displayName || user.email || "User"} data-ai-hint="profile person" />
                      <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!loading && !user && (
            <>
              <Button variant="outline" size="sm" asChild className="h-9">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="h-9">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
