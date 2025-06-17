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
  reload,
  sendPasswordResetEmail, // Import sendPasswordResetEmail
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserProfile, createUserProfileDocument, type UserProfileData, type NewUserProfileFirestoreData } from '@/services/userService';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName?: string,
    mobileNumber?: string,
    wardNo?: string
  ) => Promise<User | AuthError | undefined>;
  login: (email: string, password: string) => Promise<User | AuthError | undefined>;
  logout: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: AuthError | Error }>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserRole = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      try {
        const userProfile = await getUserProfile(currentUser.uid);
        setIsAdmin(userProfile?.role === 'admin');
      } catch (error) {
        console.error("Error fetching user role:", error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchUserRole(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserRole]);

  const signup = async (
    email: string,
    password: string,
    displayName?: string,
    mobileNumberParam?: string,
    wardNo?: string
  ): Promise<User | AuthError | undefined> => {
    setLoading(true);
    setIsAdmin(false);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const nameToSet = displayName || email.split('@')[0];
      await updateAuthProfile(userCredential.user, { displayName: nameToSet });
      await userCredential.user.reload();
      const refreshedUser = auth.currentUser;
      setUser(refreshedUser);

      if (refreshedUser) {
        const profileData: NewUserProfileFirestoreData = {
          displayName: nameToSet,
          email: refreshedUser.email,
          mobileNumber: mobileNumberParam || null,
          whatsAppNumber: null, 
          wardNo: wardNo || null,
          role: 'user',
          status: 'Active',
          joinedDate: Timestamp.now(),
          photoURL: refreshedUser.photoURL || null,
        };
        await createUserProfileDocument(refreshedUser.uid, profileData);
      }

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
      await fetchUserRole(userCredential.user);
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
      setIsAdmin(false);
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
        await fetchUserRole(auth.currentUser);
      } catch (error) {
        console.error("Error refreshing auth user:", error);
         if ((error as AuthError).code === 'auth/user-token-expired') {
          await logout();
        }
      } finally {
        setLoading(false);
      }
    } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: AuthError | Error }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error as AuthError | Error };
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signup,
    login,
    logout,
    refreshAuthUser,
    sendPasswordReset, // Add new function to context value
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
