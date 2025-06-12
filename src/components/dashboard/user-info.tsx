// src/components/dashboard/user-info.tsx
"use client";

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

export function UserInfo() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6 rounded-lg shadow-md bg-card text-card-foreground">
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
    <div className="p-6 rounded-lg shadow-md bg-card text-card-foreground">
      <div className="flex items-center space-x-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={user.photoURL || `https://placehold.co/64x64.png?text=${getInitials(user.email)}`} 
            alt={userName} 
            data-ai-hint="profile person" />
          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-headline font-semibold">Good morning, {userName}!</h2>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>
      <p className="text-muted-foreground">
        Welcome to Your Dashboard – Here's an overview of your activity, ongoing campaigns, and platform impact.
      </p>
    </div>
  );
}
