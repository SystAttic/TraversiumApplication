import React from "react";
import { Pressable, View, ActivityIndicator } from "react-native";
import { radii, spacing } from "../theme/spacing";
import { useTheme } from "../theme";
import TText from "./TText";

export default function Button({
  title,
  onPress,
  variant = "solid", // "solid" | "outline" | "ghost"
  loading,
  style,
  left,
  right,
  ...rest
}) {
  const { colors, isDark } = useTheme();

  const base = {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  };

  const variants = {
    solid: { backgroundColor: colors.accent.primary, borderWidth: 0 },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.accent.primary },
    ghost: { backgroundColor: colors.overlay, borderWidth: 0 },
  };

  const textColor = variant === "solid" ? "#fff" : colors.accent.primary;

  return (
    <Pressable onPress={onPress} disabled={loading} {...rest}>
      <View style={[base, variants[variant], style]}>
        {left ? <View>{left}</View> : null}
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <TText weight="medium" style={{ color: textColor }}>{title}</TText>
        )}
        {right ? <View>{right}</View> : null}
      </View>
    </Pressable>
  );
}
