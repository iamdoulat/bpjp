// src/components/landing/NewsTicker.tsx
"use client";

import * as React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";

export function NewsTicker() {
  const { organizationSettings, isLoadingAppSettings } = useAppContext();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const alertText = organizationSettings?.importantAlert;

  // Render a consistent skeleton on the server and on initial client render
  if (!hasMounted || isLoadingAppSettings) {
    return (
      <div className="bg-primary/10 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  // Only after mounting and if there is no alert text, render nothing.
  if (!alertText) {
    return null;
  }

  // Render the actual ticker only on the client after data is loaded.
  return (
    <div className="bg-primary/90 text-primary-foreground py-3 overflow-hidden">
      <div className="container mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Megaphone className="h-6 w-6 flex-shrink-0" />
        <div className="relative flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap animate-marquee"
            dangerouslySetInnerHTML={{ __html: alertText }}
          />
        </div>
      </div>
    </div>
  );
}
