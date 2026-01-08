import React from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";
import TText from "./TText";
import { router } from "expo-router";
import AuthenticatedImageBackground from "./AuthenticatedImageBackground";

export default function PageMiniHeader({ bgUri, title, subtitle }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.bg.layer1 }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg.layer1,
        }}
      >
        <AuthenticatedImageBackground
          source={bgUri ? { uri: bgUri } : undefined}
          imageStyle={{ opacity: 0.28 }}
          style={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
          }}
          resizeMode="cover"
        >
          {/* back */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 34, height: 34, borderRadius: 999,
              alignItems:"center", justifyContent:"center",
              backgroundColor: colors.bg.layer1,
              borderWidth:1, borderColor: colors.border,
              marginRight: spacing.md
            }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text.primary} />
          </Pressable>

          {/* centered titles */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <TText numberOfLines={1} weight="bold">{title}</TText>
            {!!subtitle && (
              <TText size="sm" dim numberOfLines={1} style={{ marginTop: 2 }}>
                {subtitle}
              </TText>
            )}
          </View>

          {/* spacer to balance back button */}
          <View style={{ width: 34, height: 34 }} />
        </AuthenticatedImageBackground>
      </View>
    </View>
  );
}
