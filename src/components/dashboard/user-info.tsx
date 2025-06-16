
// src/components/dashboard/user-info.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

export function UserInfo() {
  const { user, loading } = useAuth();
  const [greeting, setGreeting] = useState("Welcome"); // Default greeting

  useEffect(() => {
    const getBangladeshGreeting = (): string => {
      const now = new Date();
      // Get current time in UTC
      const utcHours = now.getUTCHours();
      const bstOffset = 6; // Bangladesh Standard Time is UTC+6
      
      let bstHours = utcHours + bstOffset;
      
      // Normalize bstHours to be within 0-23 range
      bstHours = bstHours % 24;
      if (bstHours < 0) {
          bstHours += 24;
      }

      if (bstHours >= 4 && bstHours < 12) { // 4:00 AM to 11:59 AM
        return "Good morning";
      } else if (bstHours >= 12 && bstHours < 17) { // 12:00 PM to 4:59 PM
        return "Good afternoon";
      } else { // 5:00 PM to 3:59 AM (covers evening and night)
        return "Good evening";
      }
    };
    setGreeting(getBangladeshGreeting());
  }, []); // Empty dependency array means this runs once on the client after mount


  if (loading) {
    return (
      <div className="w-full p-6 rounded-lg shadow-md bg-card text-card-foreground">
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
    );
  }

  if (!user) {
    // This component should ideally not be rendered if there's no user,
    // or display a generic welcome. The parent page (DashboardPage) handles the main "not logged in" state.
    return null; 
  }

  // Fallback if email is somehow null or undefined on the user object
  const userEmail = user.email || "No email provided";
  const userName = user.displayName || userEmail.split('@')[0] || "Valued Supporter";
  
  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };


  return (
    <div className="w-full p-6 rounded-lg shadow-md bg-card text-card-foreground">
      <div className="flex items-center space-x-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={user.photoURL || `https://placehold.co/64x64.png?text=${getInitials(user.email)}`} 
            alt={userName} 
            data-ai-hint="profile person" />
          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-headline font-semibold">{greeting}, {userName}!</h2>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Welcome to Your Dashboard – Here's an overview of your donations activity, ongoing campaigns, etc.
      </p>
    </div>
  );
}
