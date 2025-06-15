
// src/contexts/AuthContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import type { User, AuthError } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
  reload
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfileData } from '@/services/userService'; // Import getUserProfile

interface AuthContextType {
  user: User | null;
  isAdmin: boolean; // Added isAdmin flag
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<User | AuthError | undefined>;
  login: (email: string, password: string) => Promise<User | AuthError | undefined>;
  logout: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // State for isAdmin
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserRole = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      try {
        const userProfile = await getUserProfile(currentUser.uid);
        setIsAdmin(userProfile?.role === 'admin');
      } catch (error) {
        console.error("Error fetching user role:", error);
        setIsAdmin(false); // Default to not admin on error
      }
    } else {
      setIsAdmin(false);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchUserRole(currentUser); // Fetch role when auth state changes
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserRole]);

  const signup = async (email: string, password: string, displayName?: string): Promise<User | AuthError | undefined> => {
    setLoading(true);
    setIsAdmin(false); // Reset admin status on new signup
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const nameToSet = displayName || email.split('@')[0];
      await updateAuthProfile(userCredential.user, { displayName: nameToSet });
      await userCredential.user.reload();
      const refreshedUser = auth.currentUser;
      setUser(refreshedUser);
      // Firestore profile creation (including role) is handled by createUserProfileDocument in Manage Users page now.
      // We will fetch the role after this via onAuthStateChanged or refreshAuthUser.
      // For a new signup, they will likely be 'user' role by default unless createUserProfileDocument sets them as admin.
      await fetchUserRole(refreshedUser);
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
      await fetchUserRole(userCredential.user); // Fetch role on login
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      setIsAdmin(false);
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
      setIsAdmin(false); // Reset admin status on logout
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
        setUser(auth.currentUser);
        await fetchUserRole(auth.currentUser); // Re-fetch role on refresh
      } catch (error) {
        console.error("Error refreshing auth user:", error);
         if ((error as AuthError).code === 'auth/user-token-expired') {
          await logout();
        }
      } finally {
        setLoading(false);
      }
    } else {
        // If no auth.currentUser, ensure local state reflects that
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
    }
  };

  const value = {
    user,
    isAdmin, // Expose isAdmin
    loading,
    signup,
    login,
    logout,
    refreshAuthUser,
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
