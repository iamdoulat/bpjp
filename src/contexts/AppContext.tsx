
// src/contexts/AppContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect } from 'react';
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

  const setAppNameState = (name: string) => {
    setAppName(name);
    // Update appName within the organizationSettings state as well if it exists
    setOrganizationSettings(prevSettings => prevSettings ? { ...prevSettings, appName: name } : null);
  };

  const value = {
    appName,
    setAppNameState,
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
