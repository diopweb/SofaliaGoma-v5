
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AppUser } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';

interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (pseudo: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in, see if we have a profile for them
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setUser({ id: docSnap.id, ...docSnap.data() } as AppUser);
            } else {
              // This can happen if user record deletion fails or is pending.
              setUser(null); 
            }
            setLoading(false);
          }, 
          (err) => {
            console.error("Error fetching user profile:", err);
            setError("Failed to load user profile.");
            setUser(null);
            setLoading(false);
          }
        );
        return () => unsubscribeProfile();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Loading will be set to false by onAuthStateChanged listener
    } catch (e: any) {
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
            setError("L'adresse e-mail ou le mot de passe est incorrect.");
        } else {
            setError(e.message);
        }
      setLoading(false);
    }
  }, []);
  
  const signup = useCallback(async (pseudo: string, email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, `users`);
      const existingUsers = await getDocs(usersRef);
      const isFirstUser = existingUsers.empty;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;

      const userData: Omit<AppUser, 'id'> = {
        email: fbUser.email!,
        pseudo,
        role: isFirstUser ? ROLES.ADMIN : ROLES.SELLER,
      };

      await setDoc(doc(db, `users`, fbUser.uid), userData);
      // Loading will be set to false by onAuthStateChanged listener
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            setError("Cette adresse e-mail est déjà utilisée.");
        } else {
            setError(e.message);
        }
        setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOut(auth);
    // State will be cleared and loading set to false by onAuthStateChanged
    router.push('/login');
  }, [router]);
  
  const value = {
    firebaseUser,
    user,
    loading,
    error,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
