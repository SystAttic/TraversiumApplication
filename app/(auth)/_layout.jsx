import React from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { useTheme } from "../../src/theme";

export default function AuthLayout() {
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
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot" />
      </Stack>
    </View>
  );
}
