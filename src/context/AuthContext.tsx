
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, fbUser.uid);
        const unsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as AppUser);
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
        } else if (e.code === 'auth/user-not-found') {
            setError("Aucun utilisateur trouvé avec cette adresse e-mail.");
        }
        else {
            setError(e.message);
        }
      setLoading(false);
    }
  }, [router]);
  
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
      
      router.push('/dashboard');
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            setError("Cette adresse e-mail est déjà utilisée.");
        } else {
            setError(e.message);
        }
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
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
