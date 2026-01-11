import React from "react";
import { View, Pressable } from "react-native";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";
import TText from "./TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useNotifications } from "../contexts/NotificationContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppHeader({ title, showBell = true, rightElement }) {
  const { colors } = useTheme();
  const { unseenCount } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
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
            position: "relative",
          }}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
          {unseenCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.accent?.primary || "#FF3B30",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: colors.bg.layer1,
              }}
            >
              <TText
                size="xs"
                weight="bold"
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                }}
              >
                {unseenCount > 99 ? "99+" : unseenCount}
              </TText>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={{ width: 36, height: 36 }} />
      )}
    </View>
  );
}
