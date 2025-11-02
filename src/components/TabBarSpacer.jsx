// src/components/TabBarSpacer.jsx
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// NOTE: don't import bottom-tabs hook eagerly to avoid crashes outside tabs
let useBottomTabBarHeight;
try {
  // optional import; will be undefined if package not present
  // eslint-disable-next-line global-require
  useBottomTabBarHeight = require("@react-navigation/bottom-tabs").useBottomTabBarHeight;
} catch {
  useBottomTabBarHeight = undefined;
}

/**
 * Spacer that adds safe bottom space and (optionally) the tab bar height.
 * By default it assumes you're inside tabs. Set useTabBarHeight={false} on stack-only screens.
 */
export default function TabBarSpacer({ extra = 16, useTabBarHeight = true }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    useTabBarHeight && typeof useBottomTabBarHeight === "function"
      ? useBottomTabBarHeight() || 0
      : 0;

  const height = Math.max(insets.bottom + tabBarHeight + extra, 32);
  return <View style={{ height }} />;
}
