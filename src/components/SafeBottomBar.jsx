import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Renders an empty bar whose height equals the device bottom inset.
 * On gesture nav / physical buttons (inset = 0), it renders nothing.
 */
export default function SafeBottomBar({ backgroundColor, borderTopColor, borderTopWidth = 0 }) {
  const { bottom } = useSafeAreaInsets();
  if (!bottom) return null;

  return (
    <View
      style={{
        height: bottom,
        backgroundColor: backgroundColor ?? "transparent",
        borderTopWidth,
        borderTopColor: borderTopColor ?? "transparent",
      }}
    />
  );
}
