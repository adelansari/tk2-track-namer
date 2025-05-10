"use client";

import type { User as AppUser } from '@/lib/types'; // Renamed to avoid conflict
import { auth, googleProvider } from '@/lib/firebaseConfig';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile, type User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: AppUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (newName: string) => Promise<boolean>;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous User',
          // You can add email or photoURL here if needed in AppUser type
          // email: firebaseUser.email,
          // photoURL: firebaseUser.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Handle error (e.g., show toast to user)
      setAuthLoading(false); // Ensure loading state is reset on error
    }
    // setAuthLoading(false) is handled by onAuthStateChanged
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user to null
    } catch (error) {
      console.error("Error during sign-out:", error);
      setAuthLoading(false);
    }
  }, []);
  
  const updateDisplayName = useCallback(async (newName: string): Promise<boolean> => {
    if (!currentUser || !auth.currentUser) return false;
    
    try {
      // Update Firebase Auth display name only
      await updateProfile(auth.currentUser, { displayName: newName });
      
      // Update local state
      setCurrentUser(prev => prev ? { ...prev, name: newName } : null);
      
      return true;
    } catch (error) {
      console.error("Error updating display name:", error);
      return false;
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateDisplayName, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
