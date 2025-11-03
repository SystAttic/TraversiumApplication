// app/_layout.jsx
import "intl-pluralrules";
import "../src/i18n"; // init translations once
import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "../src/theme";
import { LoadingProvider } from "../src/providers/LoadingProvider";
import { LocaleProvider } from "../src/providers/LocaleProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <LoadingProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="trips/[id]" />
            <Stack.Screen name="users/[username]" />
            <Stack.Screen name="users/[username]/trips" />
          </Stack>
        </LoadingProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
