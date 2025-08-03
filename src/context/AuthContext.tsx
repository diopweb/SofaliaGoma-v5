
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocs, collection } from 'firebase/firestore';
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
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() } as AppUser);
      } else {
        // This case might happen if user record deletion fails.
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user profile.");
      setLoading(false);
    });

    return () => unsubscribeUser();

  }, [firebaseUser]);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Redirection will be handled by the page based on auth state
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
      const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
      const existingUsers = await getDocs(usersRef);
      const isFirstUser = existingUsers.empty;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;

      const userData: Omit<AppUser, 'id'> = {
        email: fbUser.email!,
        pseudo,
        role: isFirstUser ? ROLES.ADMIN : ROLES.SELLER,
      };

      await setDoc(doc(db, `artifacts/${appId}/public/data/users`, fbUser.uid), userData);
      // Redirection will be handled by the page based on auth state
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
    setUser(null);
    setFirebaseUser(null);
    // Setting loading to false will trigger redirection in pages.
    setLoading(false);
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
