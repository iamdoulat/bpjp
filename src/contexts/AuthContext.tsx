
// src/contexts/AuthContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/lib/firebase';
import type { User, AuthError } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile, // For updating user's Firebase Auth profile
  reload
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<User | AuthError | undefined>;
  login: (email: string, password: string) => Promise<User | AuthError | undefined>;
  logout: () => Promise<void>;
  refreshAuthUser: () => Promise<void>; // Added to refresh user state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName?: string): Promise<User | AuthError | undefined> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Use provided displayName, or default to part before @
      const nameToSet = displayName || email.split('@')[0];
      await updateAuthProfile(userCredential.user, { displayName: nameToSet });
      // Reload user to get the updated profile
      await userCredential.user.reload();
      const refreshedUser = auth.currentUser; // Get the most up-to-date user object
      setUser(refreshedUser); // This setUser is for the AuthContext, will be the new user
      return refreshedUser ?? undefined;
    } catch (error) {
      console.error("Signup error:", error);
      return error as AuthError;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User | AuthError | undefined> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      return error as AuthError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuthUser = async () => {
    if (auth.currentUser) {
      try {
        setLoading(true);
        await reload(auth.currentUser);
        setUser(auth.currentUser); // Update state with the reloaded user
      } catch (error) {
        console.error("Error refreshing auth user:", error);
         if ((error as AuthError).code === 'auth/user-token-expired') {
          // Handle token expiry, e.g., by logging out
          await logout();
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshAuthUser, // Export refresh function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
