import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { auth } from "../services/firebase";
import { getUnseenCount } from "../services/notificationApi";
import { NOTIFICATION_SERVICE_BASE } from "../services/traversiumApi";
import { getTenantId } from "../utils/tenantStorage";
import * as SecureStore from "expo-secure-store";

const NotificationContext = createContext(null);

const TOKEN_KEY = "traversium_token";
const HEALTHCHECK_INTERVAL = 30000; // 30 seconds
const HEALTHCHECK_TIMEOUT = 40000; // 40 seconds (allow some buffer)

/**
 * Get Firebase ID token for authentication
 */
async function getIdToken() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to get ID token:", error);
    return null;
  }
}

/**
 * Create SSE connection using fetch (React Native compatible)
 */
async function createSSEConnection(onMessage, onError) {
  let reader = null;
  let isCancelled = false;
  
  try {
    const token = await getIdToken();
    const tenantId = await getTenantId();
    
    if (!token) {
      throw new Error("No authentication token available");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    };
    
    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }

    const response = await fetch(`${NOTIFICATION_SERVICE_BASE}/rest/v1/notifications/sse`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is not available");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const readStream = async () => {
      try {
        while (!isCancelled) {
          const { done, value } = await reader.read();
          
          if (done || isCancelled) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (isCancelled) break;
            
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                onMessage(data);
              } catch (e) {
                console.warn("Failed to parse SSE message:", e);
              }
            }
          }
        }
      } catch (error) {
        if (!isCancelled) {
          onError(error);
        }
      }
    };

    // Start reading in background
    readStream().catch((error) => {
      if (!isCancelled) {
        onError(error);
      }
    });
    
    return () => {
      isCancelled = true;
      if (reader) {
        reader.cancel().catch(() => {});
      }
    };
  } catch (error) {
    if (!isCancelled) {
      onError(error);
    }
    return () => {
      isCancelled = true;
      if (reader) {
        reader.cancel().catch(() => {});
      }
    };
  }
}

export function NotificationProvider({ children }) {
  const [unseenCount, setUnseenCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const bundleIdsRef = useRef(new Set());
  const sseCleanupRef = useRef(null);
  const healthcheckTimerRef = useRef(null);
  const lastHealthcheckRef = useRef(Date.now());
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Fetch unseen count
  const fetchUnseenCount = useCallback(async () => {
    try {
      const count = await getUnseenCount();
      setUnseenCount(count || 0);
    } catch (error) {
      console.warn("Failed to fetch unseen count:", error);
      setUnseenCount(0);
    }
  }, []);

  // Handle SSE messages
  const handleSSEMessage = useCallback((data) => {
    if (data.bundleId === "HEALTHCHECK") {
      lastHealthcheckRef.current = Date.now();
      return;
    }

    // Store unique bundle IDs
    if (data.bundleId && !bundleIdsRef.current.has(data.bundleId)) {
      bundleIdsRef.current.add(data.bundleId);
      // Update unseen count when new notification arrives
      setUnseenCount((prev) => prev + 1);
    }
  }, []);

  // Handle SSE errors
  const handleSSEError = useCallback((error) => {
    console.warn("SSE connection error:", error);
    setIsConnected(false);
    
    // Cleanup
    if (sseCleanupRef.current) {
      sseCleanupRef.current();
      sseCleanupRef.current = null;
    }
    
    // Reconnect after a delay
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isConnectingRef.current && appStateRef.current === "active") {
        connectSSE();
      }
    }, 5000);
  }, []);

  // Connect to SSE
  const connectSSE = useCallback(async () => {
    if (isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    
    try {
      const cleanup = await createSSEConnection(handleSSEMessage, handleSSEError);
      
      if (cleanup) {
        sseCleanupRef.current = cleanup;
        setIsConnected(true);
        lastHealthcheckRef.current = Date.now();
      }
    } catch (error) {
      handleSSEError(error);
    } finally {
      isConnectingRef.current = false;
    }
  }, [handleSSEMessage, handleSSEError]);

  // Monitor healthcheck
  useEffect(() => {
    if (!isConnected) return;

    healthcheckTimerRef.current = setInterval(() => {
      const timeSinceLastHealthcheck = Date.now() - lastHealthcheckRef.current;
      
      if (timeSinceLastHealthcheck > HEALTHCHECK_TIMEOUT) {
        console.warn("Healthcheck timeout, reconnecting...");
        setIsConnected(false);
        
        if (sseCleanupRef.current) {
          sseCleanupRef.current();
          sseCleanupRef.current = null;
        }
        
        // Reconnect
        fetchUnseenCount();
        connectSSE();
      }
    }, HEALTHCHECK_INTERVAL);

    return () => {
      if (healthcheckTimerRef.current) {
        clearInterval(healthcheckTimerRef.current);
      }
    };
  }, [isConnected, connectSSE, fetchUnseenCount]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        // App came to foreground
        fetchUnseenCount();
        if (!isConnected && !isConnectingRef.current) {
          connectSSE();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        if (sseCleanupRef.current) {
          sseCleanupRef.current();
          sseCleanupRef.current = null;
        }
        setIsConnected(false);
      }
      
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [isConnected, connectSSE, fetchUnseenCount]);

  // Initialize on mount
  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    // Wait for auth to be ready
    unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!mounted) return;
      
      if (user) {
        await fetchUnseenCount();
        if (!isConnected && !isConnectingRef.current) {
          await connectSSE();
        }
      } else {
        setUnseenCount(0);
        if (sseCleanupRef.current) {
          sseCleanupRef.current();
          sseCleanupRef.current = null;
        }
        setIsConnected(false);
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (sseCleanupRef.current) {
        sseCleanupRef.current();
      }
      if (healthcheckTimerRef.current) {
        clearInterval(healthcheckTimerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchUnseenCount, connectSSE, isConnected]);

  const value = {
    unseenCount,
    isConnected,
    refreshCount: fetchUnseenCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
