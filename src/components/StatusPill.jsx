import React from "react";
import { View } from "react-native";
import { radii, spacing } from "../theme/spacing";
import { useTheme } from "../theme";
import TText from "./TText";

export default function StatusPill({ type = "info", label, style }) {
  const { colors } = useTheme();
  const map = {
    success: colors.status.success,
    warning: colors.status.warning,
    danger: colors.status.danger,
    info: colors.status.info,
  };
  const bg = map[type] + "22"; // faint background
  const fg = map[type];

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: fg + "55",
        },
        style,
      ]}
    >
      <TText weight="medium" size="sm" style={{ color: fg }}>
        {label || type}
      </TText>
    </View>
  );
}
