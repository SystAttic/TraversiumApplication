import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "../src/theme";
import { LoadingProvider } from "../src/providers/LoadingProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trips/[id]" />
          <Stack.Screen name="users/[username]" />
        </Stack>
      </LoadingProvider>
    </ThemeProvider>
  );
}
