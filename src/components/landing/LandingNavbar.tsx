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
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const { appName } = useAppContext();
  const { user, loading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  const [scrolled, setScrolled] = React.useState(false);
  const [activeLink, setActiveLink] = React.useState("");
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);


  React.useEffect(() => {
    if (!hasMounted) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleHashChange = () => {
      setActiveLink(window.location.hash);
    };
    
    // Set initial active link after component mounts on client
    handleHashChange();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("hashchange", handleHashChange, false);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange, false);
    };
  }, [hasMounted]);

  const navLinks = [
    { href: "#campaigns", label: "Campaigns" },
    { href: "#events", label: "Events" },
    { href: "#mission", label: "Mission" },
    { href: "#about", label: "About" },
    { href: "#committee", label: "Committee" },
  ];
  
  if (!hasMounted) {
    // Render a skeleton or null during SSR and initial client render to avoid hydration mismatch
    return (
      <header className="sticky top-0 z-50 w-full bg-transparent">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
           <div className="flex items-center gap-2">
             <Skeleton className="h-8 w-8 rounded" />
             <Skeleton className="h-6 w-24" />
           </div>
            <div className="hidden items-center gap-6 md:flex">
               {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-20" />)}
            </div>
           <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
           </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-border/40 bg-background/95 backdrop-blur-sm" : "bg-transparent"}`}>
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
            {appLogoUrl && <Image src={appLogoUrl} alt={`${appName} Logo`} width={32} height={32} className="h-8 w-8 rounded" data-ai-hint="logo company" />}
            <div className="text-xl font-bold text-foreground">
                <span className="md:hidden">BPJP</span>
                <span className="hidden md:inline">{appName}</span>
            </div>
            </Link>
        </div>
        <nav className="hidden items-center gap-6 text-base font-medium md:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-black dark:text-muted-foreground transition-colors hover:text-black dark:hover:text-foreground pb-1",
                activeLink === link.href && "text-green-600 dark:text-green-500 font-semibold border-b-2 border-black dark:border-green-500"
              )}
              onClick={() => setActiveLink(link.href)}
            >
              {link.label}
            </Link>
          ))}
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
              <Button variant="default" asChild>
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
