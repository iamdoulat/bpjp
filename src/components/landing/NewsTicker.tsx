// src/components/landing/NewsTicker.tsx
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";

export function NewsTicker() {
  const { organizationSettings, isLoadingAppSettings } = useAppContext();

  const alertText = organizationSettings?.importantAlert;

  if (isLoadingAppSettings) {
    return (
      <div className="bg-primary/10 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (!alertText) {
    return null; // Don't render anything if there's no alert text
  }

  return (
    <div className="bg-primary/90 text-primary-foreground py-3 overflow-hidden">
      <div className="container mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Megaphone className="h-6 w-6 flex-shrink-0" />
        <div className="relative flex-1 overflow-hidden">
          <p className="whitespace-nowrap animate-marquee">
            {alertText}
          </p>
        </div>
      </div>
    </div>
  );
}
