// src/components/landing/LandingNavbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Moon, Sun } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

export function LandingNavbar() {
  const { appName } = useAppContext();
  const { user, loading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-border/40 bg-background/95 backdrop-blur-sm" : "bg-transparent"}`}>
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          {appLogoUrl && <Image src={appLogoUrl} alt={`${appName} Logo`} width={32} height={32} className="h-8 w-8 rounded" data-ai-hint="logo company" />}
          <div className="text-xl font-bold text-foreground">
            <span className="md:hidden">BPJP</span>
            <span className="hidden md:inline">{appName}</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="#campaigns" className="text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground">Campaigns</Link>
          <Link href="#events" className="text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground">Events</Link>
          <Link href="#mission" className="text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground">Mission</Link>
          <Link href="#about" className="text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground">About</Link>
          <Link href="#committee" className="text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground">Committee</Link>
        </nav>
        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {loading ? (
            <Skeleton className="h-9 w-20 rounded-md" />
          ) : user ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" /> Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
