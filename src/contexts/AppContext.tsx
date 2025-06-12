// src/contexts/AppContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect } from 'react';

interface AppContextType {
  appName: string;
  setAppNameState: (name: string) => void;
  // Potentially add other global app settings here in the future
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with environment variable, then fallback to "BPJP"
  // This initial state could later be overridden by fetching from Firestore
  const [appName, setAppName] = useState<string>(process.env.NEXT_PUBLIC_APP_NAME || "BPJP");

  // Example: Fetch initial appName from localStorage or a service on mount
  // useEffect(() => {
  //   const storedAppName = localStorage.getItem('appName');
  //   if (storedAppName) {
  //     setAppName(storedAppName);
  //   }
  //   // Or fetch from Firestore here if settings are global and not user-specific
  // }, []);

  const setAppNameState = (name: string) => {
    setAppName(name);
    // Optionally persist to localStorage for non-critical persistence
    // localStorage.setItem('appName', name);
  };

  const value = {
    appName,
    setAppNameState,
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
