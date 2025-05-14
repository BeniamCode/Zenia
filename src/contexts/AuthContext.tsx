
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
      document.cookie = `userRole=${profile.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      setIsAdmin(false);
      document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax'; // Clear role cookie
    }
  }, []);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); 
      if (firebaseUser) {
        setUser(firebaseUser);
        // It's good practice to set the firebaseIdToken cookie here as well,
        // ensuring it's refreshed if the user was already logged in.
        try {
            const idToken = await firebaseUser.getIdToken();
            document.cookie = `firebaseIdToken=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        } catch (tokenError) {
            console.error("Error getting ID token in AuthContext:", tokenError);
            // Clear potentially stale token cookie if fetching new one fails
            document.cookie = 'firebaseIdToken=; path=/; max-age=0; SameSite=Lax';
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            updateUserProfileInContext(profileData); // This will set userProfile and userRole cookie
          } else {
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid);
            const defaultProfile: UserProfile = { 
              uid: firebaseUser.uid, 
              email: firebaseUser.email, 
              displayName: firebaseUser.displayName, 
              role: 'client', 
            };
            updateUserProfileInContext(defaultProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          updateUserProfileInContext(null);
          setLoading(false);
        });
        return () => profileUnsubscribe(); 
      } else {
        setUser(null);
        updateUserProfileInContext(null); // This will clear userProfile and userRole cookie
        // Clear firebaseIdToken cookie on logout
        document.cookie = 'firebaseIdToken=; path=/; max-age=0; SameSite=Lax';
        setLoading(false);
      }
    });

    return () => authUnsubscribe(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateUserProfileInContext]); // Added updateUserProfileInContext to dependencies

  if (loading && !userProfile && user === null) { 
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
