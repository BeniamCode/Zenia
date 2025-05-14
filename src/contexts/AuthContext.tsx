
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // Added onSnapshot for real-time profile updates
import type { UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  setUserProfile: (profile: UserProfile | null) => void; // Function to update profile in context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateUserProfileInContext = useCallback((profile: UserProfile | null) => {
    setUserProfileState(profile);
    if (profile) {
      setIsAdmin(profile.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Set loading true when auth state might change
      if (firebaseUser) {
        setUser(firebaseUser);
        // Firestore real-time listener for user profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setUserProfileState(profileData);
            setIsAdmin(profileData.role === 'admin');
          } else {
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid);
            // Create a default local profile if none exists in Firestore, but this shouldn't happen if signup creates it
            const defaultProfile: UserProfile = { 
              uid: firebaseUser.uid, 
              email: firebaseUser.email, 
              displayName: firebaseUser.displayName, 
              role: 'client', // Default to client
              // Ensure all required fields for UserProfile are here
            };
            setUserProfileState(defaultProfile);
            setIsAdmin(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfileState(null); // Clear profile on error
          setIsAdmin(false);
          setLoading(false);
        });
        return () => profileUnsubscribe(); // Cleanup Firestore listener
      } else {
        setUser(null);
        setUserProfileState(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => authUnsubscribe(); // Cleanup auth listener
  }, []);

  if (loading && !userProfile && user === null) { // Show loader only on initial app load or full sign-out
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Initializing Nutrition Navigator...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, setUserProfile: updateUserProfileInContext }}>
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
