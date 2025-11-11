import React from "react";
import { View, Pressable } from "react-native";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";
import TText from "./TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

export default function AppHeader({ title, showBell = true, rightElement }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.bg.layer1,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TText weight="bold" size="lg">{title}</TText>

      {rightElement ? (
        rightElement
      ) : showBell ? (
        <Pressable
          onPress={() => router.push("/notifications")}
          hitSlop={10}
          style={{
            width: 36, height: 36, borderRadius: 999,
            alignItems: "center", justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 36, height: 36 }} />
      )}
    </View>
  );
}
