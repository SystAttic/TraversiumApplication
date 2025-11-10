// Base API configuration and HTTP client
import { Platform } from "react-native";
import { auth } from "./firebase";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "traversium_token";

// For mobile development: localhost doesn't work on physical devices or Android emulator
// Android emulator uses 10.0.2.2 to access host machine's localhost
// iOS simulator can use localhost
// Physical devices need the actual IP address of your development machine
function getApiBase() {
  // Allow override via environment variable
  if (process.env.EXPO_PUBLIC_TRAVERSIUM_API_BASE) {
    return process.env.EXPO_PUBLIC_TRAVERSIUM_API_BASE;
  }
  
  // Default: use Android emulator address (works for most dev setups)
  // For physical devices, set EXPO_PUBLIC_TRAVERSIUM_API_BASE to your machine's IP (e.g., http://192.168.1.100:8080)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080"; // Android emulator
  }
  
  // iOS simulator can use localhost
  return "http://localhost:8080";
}

export const API_BASE = getApiBase();
console.log("API_BASE", API_BASE);

/**
 * Get Firebase ID token for authentication
 * Tries to get fresh token from current user, falls back to stored token
 */
async function getIdToken() {
  try {
    // Try to get fresh token from current Firebase user
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    // Fallback to stored token
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to get ID token:", error);
    return null;
  }
}

/**
 * Check if a path requires authentication
 * /users/exists does NOT require authentication
 */
function requiresAuth(path) {
  return !path.includes("/users/exists");
}

// Generic HTTP client (can be used by other API modules)
export async function http(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  
  // Add Bearer token if authentication is required
  if (requiresAuth(path)) {
    const token = await getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
