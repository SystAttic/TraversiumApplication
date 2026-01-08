import React from "react";
import { View, Pressable, Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";
import TText from "../TText";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import AuthenticatedImageBackground from "../AuthenticatedImageBackground";

const HEADER_MAX = 240;   // big cover
const HEADER_MIN = 64;    // collapsed height (like a top bar)

export default function TripCollapsibleHeader({ trip, scrollY }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // interpolate height & overlay
  const headerH = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [HEADER_MAX, HEADER_MIN],
    extrapolate: "clamp",
  });
  const titleY = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [0, -32],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [1, 0.88],
    extrapolate: "clamp",
  });
  const dim = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [0, 0.35],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={{ height: headerH, overflow: "hidden" }}>
      <AuthenticatedImageBackground
        source={{ uri: trip?.coverUri }}
        style={{ flex: 1, backgroundColor: colors.bg.layer3 }}
        imageStyle={{ opacity: 0.95 }}
      >
        {/* top controls */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.xl,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* back */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38, height: 38, borderRadius: 999, alignItems:"center", justifyContent:"center",
              backgroundColor: colors.bg.layer1, opacity: 0.9, borderWidth:1, borderColor: colors.border,
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
          </Pressable>

          {/* share */}
          <Pressable
            onPress={async () => {
              const link = `https://traversium.com/trips/${trip?.id || ""}`;
              try { await Clipboard.setStringAsync(link); } catch {}
            }}
            style={{
              width: 38, height: 38, borderRadius: 999, alignItems:"center", justifyContent:"center",
              backgroundColor: colors.bg.layer1, opacity: 0.9, borderWidth:1, borderColor: colors.border,
            }}
          >
            <Ionicons name="share-social" size={18} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* title overlay */}
        <Animated.View
          style={{
            position: "absolute",
            left: spacing.xl,
            right: spacing.xl,
            bottom: spacing.lg,
            transform: [{ translateY: titleY }, { scale: titleScale }],
          }}
        >
          <TText
            weight="bold"
            style={{ fontSize: 28 }}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {trip?.title || "Trip"}
          </TText>
        </Animated.View>

        {/* darken on collapse (fake blur) */}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.bg.layer1,
            opacity: dim,
          }}
        />
      </AuthenticatedImageBackground>
    </Animated.View>
  );
}

import { StyleSheet } from "react-native";
