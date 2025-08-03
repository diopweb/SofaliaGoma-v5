
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser, GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '@/lib/firebase';
import { AppUser } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';

interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, fbUser.uid);
        const unsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as AppUser);
          } else {
             // This case is for first time Google login, the user doc is created in loginWithGoogle
          }
          setLoading(false);
        });
        return () => unsub();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (e: any) {
        if (e.code === 'auth/invalid-credential') {
            setError("L'adresse e-mail ou le mot de passe est incorrect.");
        } else {
            setError(e.message);
        }
      setLoading(false);
    }
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, googleUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            // New user, create a document for them
            const newUser: AppUser = {
                id: googleUser.uid,
                email: googleUser.email!,
                pseudo: googleUser.displayName || googleUser.email!,
                role: ROLES.SELLER as 'seller', // Default role
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
        }
        router.push('/dashboard');
    } catch(e: any) {
        setError(e.message);
        setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [router]);
  
  const value = {
    firebaseUser,
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
