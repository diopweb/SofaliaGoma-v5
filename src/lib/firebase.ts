import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnNBQzriKP4k1F60IeABoq3dqrj5lxmKY",
  authDomain: "sofalia-goma.firebaseapp.com",
  projectId: "sofalia-goma",
  storageBucket: "sofalia-goma.firebasestorage.app",
  messagingSenderId: "670754253328",
  appId: "1:670754253328:web:709c3c52dd9b99d130b895",
  measurementId: "G-VC4QG2XBET"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof (globalThis as any).__app_id !== 'undefined' ? (globalThis as any).__app_id : 'default-app-id';

export { app, auth, db, appId, firebaseConfig };
