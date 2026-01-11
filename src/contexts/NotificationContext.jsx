import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { auth } from "../services/firebase";
import { getUnseenCount } from "../services/notificationApi";

const NotificationContext = createContext(null);

const REFRESH_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const [unseenCount, setUnseenCount] = useState(0);
  const refreshIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const mountedRef = useRef(true);

  // Fetch unseen count
  const fetchUnseenCount = useCallback(async () => {
    try {
      const count = await getUnseenCount();
      if (mountedRef.current) {
        setUnseenCount(count || 0);
      }
    } catch (error) {
      console.warn("Failed to fetch unseen count:", error);
      if (mountedRef.current) {
        setUnseenCount(0);
      }
    }
  }, []);

  // Handle app state changes - refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        // App came to foreground - refresh count
        fetchUnseenCount();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [fetchUnseenCount]);

  // Set up periodic refresh when app is active
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (appStateRef.current === "active") {
        fetchUnseenCount();
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchUnseenCount]);

  // Initialize on mount
  useEffect(() => {
    let unsubscribe = null;
    mountedRef.current = true;

    // Wait for auth to be ready
    unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!mountedRef.current) return;
      
      if (user) {
        await fetchUnseenCount();
      } else {
        setUnseenCount(0);
      }
    });

    return () => {
      mountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchUnseenCount]);

  const value = {
    unseenCount,
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
