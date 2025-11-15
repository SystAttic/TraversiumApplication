// app/_layout.jsx
import "intl-pluralrules";
import "../src/i18n";
import React from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../src/theme";
import { LoadingProvider } from "../src/providers/LoadingProvider";
import { LocaleProvider } from "../src/providers/LocaleProvider";

function ThemedStack() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.bg.layer1,
          },
          cardStyle: {
            backgroundColor: colors.bg.layer1,
          },
          animation: "default",
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trips/[id]/index" />
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
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <LoadingProvider>
          <ThemedStack />
        </LoadingProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
