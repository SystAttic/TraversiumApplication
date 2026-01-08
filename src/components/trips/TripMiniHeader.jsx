import React from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";
import TText from "../TText";
import { router } from "expo-router";
import AuthenticatedImageBackground from "../AuthenticatedImageBackground";

export default function TripMiniHeader({ trip }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.bg.layer1 }}>
      {/* FULL-WIDTH white(ish) box with rounded corners, no outer padding */}
      <View
        style={{
          marginHorizontal: 0,
          borderRadius: 0,                // flush to edges/top as requested
          borderBottomWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg.layer1,
        }}
      >
        {/* inner blurred-looking band using cover as bg */}
        <AuthenticatedImageBackground
          source={{ uri: trip?.coverUri }}
          imageStyle={{ opacity: 0.28 }} // soft overlay feel
          style={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
          }}
          resizeMode="cover"
        >
          {/* back on left */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 34, height: 34, borderRadius: 999, alignItems:"center", justifyContent:"center",
              backgroundColor: colors.bg.layer1, borderWidth:1, borderColor: colors.border, marginRight: spacing.md
            }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text.primary} />
          </Pressable>

          {/* title centered */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <TText numberOfLines={1} weight="bold">
              {trip?.title || "Trip"}
            </TText>
          </View>

          {/* spacer to balance back button layout */}
          <View style={{ width: 34, height: 34 }} />
        </AuthenticatedImageBackground>
      </View>
    </View>
  );
}
