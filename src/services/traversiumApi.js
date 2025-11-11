// Base API configuration and HTTP client
import { Platform } from "react-native";
import { auth } from "./firebase";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "traversium_token";

// For mobile development: localhost doesn't work on physical devices or Android emulator
// Android emulator uses 10.0.2.2 to access host machine's localhost
// iOS simulator can use localhost
// Physical devices need the actual IP address of your development machine
function getApiBase(serviceName = "USER_SERVICE") {
  // Map service names to environment variable names
  const envVarMap = {
    USER_SERVICE: "EXPO_PUBLIC_TRAVERSIUM_USER_SERVICE_BASE",
    TRIP_SERVICE: "EXPO_PUBLIC_TRAVERSIUM_TRIP_SERVICE_BASE",
    FILE_STORAGE_SERVICE: "EXPO_PUBLIC_TRAVERSIUM_FILE_STORAGE_SERVICE_BASE",
    NOTIFICATION_SERVICE: "EXPO_PUBLIC_TRAVERSIUM_NOTIFICATION_SERVICE_BASE",
    SOCIAL_SERVICE: "EXPO_PUBLIC_TRAVERSIUM_SOCIAL_SERVICE_BASE",
  };

  const envVar = envVarMap[serviceName];
  const envValue = envVar ? process.env[envVar] : null;

  // Allow override via environment variable
  if (envValue) {
    return envValue;
  }

  // Fallback to legacy variable for backward compatibility
  if (process.env.EXPO_PUBLIC_TRAVERSIUM_API_BASE) {
    return process.env.EXPO_PUBLIC_TRAVERSIUM_API_BASE;
  }

  // Default ports for each service
  const defaultPorts = {
    USER_SERVICE: 8080,
    TRIP_SERVICE: 8091,
    FILE_STORAGE_SERVICE: 8092,
    NOTIFICATION_SERVICE: 8093,
    SOCIAL_SERVICE: 8094,
  };

  const port = defaultPorts[serviceName] || 8080;
  const baseHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  
  return `http://${baseHost}:${port}`;
}

// Export service-specific base URLs
export const USER_SERVICE_BASE = getApiBase("USER_SERVICE");
export const TRIP_SERVICE_BASE = getApiBase("TRIP_SERVICE");
export const FILE_STORAGE_SERVICE_BASE = getApiBase("FILE_STORAGE_SERVICE");
export const NOTIFICATION_SERVICE_BASE = getApiBase("NOTIFICATION_SERVICE");
export const SOCIAL_SERVICE_BASE = getApiBase("SOCIAL_SERVICE");

// Legacy export for backward compatibility
export const API_BASE = USER_SERVICE_BASE;

console.log("USER_SERVICE_BASE:", USER_SERVICE_BASE);
console.log("TRIP_SERVICE_BASE:", TRIP_SERVICE_BASE);

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

/**
 * Generic HTTP client (can be used by other API modules)
 * @param {string} path - API endpoint path (e.g., "/rest/v1/users")
 * @param {Object} opts - Fetch options (method, body, headers, etc.)
 * @param {string} serviceBase - Optional service base URL. If not provided, uses USER_SERVICE_BASE
 * @returns {Promise<any>}
 */
export async function http(path, opts = {}, serviceBase = USER_SERVICE_BASE) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  
  // Add Bearer token if authentication is required
  if (requiresAuth(path)) {
    const token = await getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  const res = await fetch(`${serviceBase}${path}`, {
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
