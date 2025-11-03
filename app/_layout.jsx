// app/_layout.jsx
import "intl-pluralrules";
import "../src/i18n";
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
            <Stack.Screen name="settings/edit-profile" />
            <Stack.Screen name="settings/payments" />
            <Stack.Screen name="settings/followers" />
            <Stack.Screen name="settings/following" />
            <Stack.Screen name="settings/blocked" />
            <Stack.Screen name="settings/licenses" />
            <Stack.Screen name="settings/delete" />
          </Stack>
        </LoadingProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
