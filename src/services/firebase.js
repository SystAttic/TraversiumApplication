// src/services/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signOut,
  deleteUser,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Move these to .env and reference via EXPO_PUBLIC_* so they work on client
const firebaseConfig = {
  apiKey: "AIzaSyBxaOgZmFAjatwJnUgW5AN58zpu7OhRBEc",
  authDomain: "traversium.firebaseapp.com",
  projectId: "traversium",
  storageBucket: "traversium.firebasestorage.app",
  messagingSenderId: "149009559405",
  appId: "1:149009559405:web:d3e58c807366cfb9de3464",
  measurementId: "G-BTMBHC9CW1"
};

// Ensure we only initialize the app once (safe for hot reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// In React Native, use initializeAuth with AsyncStorage persistence.
// On fast refresh, initializeAuth can throw if called again—fall back to getAuth.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Re-export the basic email/password helpers you'll use
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signOut,
  deleteUser,
};
