import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../theme";

export default function Screen({ children }) {
  const { colors, isDark } = useTheme();

  // On Android, StatusBar backgroundColor applies. On iOS, SafeAreaView handles the top inset.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.bg.layer1} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
