
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC05h8Lxtgmu1gbMWfFwd8BZVFc5qtpVYk",
  authDomain: "ma-boutique-kbtsu.firebaseapp.com",
  projectId: "ma-boutique-kbtsu",
  storageBucket: "ma-boutique-kbtsu.firebasestorage.app",
  messagingSenderId: "1041186465371",
  appId: "1:1041186465371:web:928c67df3f6f4e7332417e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const appId = firebaseConfig.appId;

export { app, auth, db, appId, firebaseConfig };
