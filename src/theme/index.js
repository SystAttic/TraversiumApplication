import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightPalette, darkPalette } from "./colors";

const STORAGE_KEY = "traversium:themeMode"; // "light" | "dark" | "system"
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("system"); // "light" | "dark" | "system"
  const colorScheme = Appearance.getColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") setMode(saved);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, [mode]);

  const isDark = useMemo(() => {
    if (mode === "system") return colorScheme === "dark";
    return mode === "dark";
  }, [mode, colorScheme]);

  const colors = isDark ? darkPalette : lightPalette;

  const value = useMemo(() => ({ mode, setMode, colors, isDark }), [mode, colors, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
