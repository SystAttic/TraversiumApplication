import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";

export default function ProgressBar({ value = 0, max = 100, height = 10, radius = 999 }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ width: "100%", backgroundColor: colors.bg.layer2, borderRadius: radius, height }}>
      <View
        style={{
          width: `${pct * 100}%`,
          height,
          borderRadius: radius,
          backgroundColor: colors.accent.primary,
        }}
      />
    </View>
  );
}
