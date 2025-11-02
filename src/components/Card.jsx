import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme";
import { radii, spacing } from "../theme/spacing";

export default function Card({ inset, padded = true, style, children, ...rest }) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: inset ? colors.bg.layer3 : colors.bg.layer2,
          borderRadius: radii.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: "hidden",
        },
        padded && { padding: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}
