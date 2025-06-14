
// src/contexts/AppContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // Added useCallback
import { getOrganizationSettings, type OrganizationSettingsData } from '@/services/organizationSettingsService'; // Import the service

interface AppContextType {
  appName: string;
  setAppNameState: (name: string) => void;
  organizationSettings: OrganizationSettingsData | null; // Add organization settings to context
  isLoadingAppSettings: boolean; // Add loading state
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appName, setAppName] = useState<string>(process.env.NEXT_PUBLIC_APP_NAME || "BPJP");
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettingsData | null>(null);
  const [isLoadingAppSettings, setIsLoadingAppSettings] = useState(true);

  useEffect(() => {
    async function fetchInitialAppSettings() {
      setIsLoadingAppSettings(true);
      try {
        const settings = await getOrganizationSettings();
        if (settings) {
          setOrganizationSettings(settings);
          if (settings.appName) {
            setAppName(settings.appName);
          }
        }
      } catch (error) {
        console.error("Error fetching initial app settings from Firestore:", error);
        // Fallback to defaults or environment variables if fetch fails
        setAppName(process.env.NEXT_PUBLIC_APP_NAME || "BPJP");
      } finally {
        setIsLoadingAppSettings(false);
      }
    }
    fetchInitialAppSettings();
  }, []);

  // Memoize the setAppNameState function that will be passed in context
  const memoizedSetAppNameState = useCallback((name: string) => {
    setAppName(name);
  }, []); // setAppName from useState is stable, so empty dependency array for useCallback

  const value = {
    appName,
    setAppNameState: memoizedSetAppNameState, // Use the memoized version
    organizationSettings,
    isLoadingAppSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

