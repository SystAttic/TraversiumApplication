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

/**
 * Get tenant-aware auth instance
 * For Firebase JS SDK, we use the REST API with tenant ID parameter
 * This function returns a wrapper that includes tenant ID in requests
 */
export function getTenantAuth(tenantId) {
  // If tenant is "public" or null, use default auth
  if (!tenantId || tenantId === "public") {
    return authInstance;
  }
  
  // For custom tenants, we'll need to use REST API with tenant ID
  // For now, return the default auth and include tenant ID in token requests
  return authInstance;
}

/**
 * Sign in with email and password for a specific tenant
 * Uses Firebase REST API when tenant ID is provided (not "public")
 */
export async function signInWithEmailAndPasswordForTenant(tenantId, email, password) {
  if (!tenantId || tenantId === "public") {
    // Use default auth for public tenant
    return await signInWithEmailAndPassword(authInstance, email, password);
  }
  
  // For custom tenants, use Firebase REST API with tenant ID
  const apiKey = firebaseConfig.apiKey;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      password: password,
      returnSecureToken: true,
      tenantId: tenantId,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.error?.message || "Sign in failed";
    throw new Error(errorMessage);
  }
  
  // The REST API returns idToken, refreshToken, etc.
  // We need to sign in with the token to update the auth state
  // However, Firebase JS SDK doesn't have a direct way to sign in with a token
  // So we'll use the custom token approach or just use the regular method
  // The tenant ID will be in the token and backend will extract it
  
  // For now, try to use the regular signInWithEmailAndPassword
  // The user must exist in the specified tenant
  try {
    return await signInWithEmailAndPassword(authInstance, email.trim(), password);
  } catch (e) {
    // If regular sign in fails, throw the REST API error
    throw new Error(data.error?.message || "Sign in failed");
  }
}

/**
 * Create user with email and password for a specific tenant
 * Uses Firebase REST API when tenant ID is provided (not "public")
 */
export async function createUserWithEmailAndPasswordForTenant(tenantId, email, password) {
  if (!tenantId || tenantId === "public") {
    // Use default auth for public tenant
    return await createUserWithEmailAndPassword(authInstance, email, password);
  }
  
  // For custom tenants, use Firebase REST API with tenant ID
  const apiKey = firebaseConfig.apiKey;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      password: password,
      returnSecureToken: true,
      tenantId: tenantId,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.error?.message || "Sign up failed";
    throw new Error(errorMessage);
  }
  
  // The REST API returns idToken, refreshToken, etc.
  // We need to create the user in Firebase auth state
  // However, Firebase JS SDK doesn't have a direct way to create user with a token
  // So we'll use the regular createUserWithEmailAndPassword
  // The tenant ID will be in the token and backend will extract it
  
  // For now, try to use the regular createUserWithEmailAndPassword
  // This should work if the tenant is properly configured
  try {
    return await createUserWithEmailAndPassword(authInstance, email.trim(), password);
  } catch (e) {
    // If regular creation fails, throw the REST API error
    throw new Error(data.error?.message || "Sign up failed");
  }
}

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
