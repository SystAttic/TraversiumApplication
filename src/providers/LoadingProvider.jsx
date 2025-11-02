import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { View, ActivityIndicator, Pressable } from "react-native";
import { useTheme } from "../theme";

const Ctx = createContext(null);

export function LoadingProvider({ children }) {
  const counter = useRef(0);
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => {
    counter.current += 1;
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setVisible(false);
  }, []);

  const value = useMemo(() => ({ show, hide, visible }), [show, hide, visible]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <GlobalLoadingOverlay />
    </Ctx.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLoading must be used inside LoadingProvider");
  return ctx;
}

function GlobalLoadingOverlay() {
  const { visible } = useContext(Ctx);
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  return (
    // Pressable with pointerEvents to block touch
    <Pressable
      pointerEvents="auto"
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.18)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.bg.layer2,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          minWidth: 140,
          alignItems: "center",
          gap: 8,
        }}
      >
        <ActivityIndicator />
      </View>
    </Pressable>
  );
}
