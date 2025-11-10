import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";

export default function ProgressSteps({ total=3, current=1 }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.md }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < current;
        return (
          <View
            key={`step-${i}`}
            style={{
              height: 6,
              flex: 1,
              borderRadius: radii.lg,
              backgroundColor: active ? colors.accent.primary : colors.bg.layer3,
            }}
          />
        );
      })}
    </View>
  );
}
