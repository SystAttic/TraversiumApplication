// src/components/trips/TripBottomBar.jsx
import React, { useRef, useState, useEffect } from "react";
import { View, Pressable, Animated, Easing } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../../theme";
import TText from "../TText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Export a constant so screens can reserve space for the base (non-extendable) bar only
export const TRIP_BAR_BASE_HEIGHT = 56;

export default function TripBottomBar({ active="timeline", onChange, onAction }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  // animations
  const rotate = useRef(new Animated.Value(0)).current; // 0..1
  const slide  = useRef(new Animated.Value(0)).current; // 0..1
  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotate, { toValue: expanded ? 1 : 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(slide,  { toValue: expanded ? 1 : 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, [expanded]);

  const spin = rotate.interpolate({ inputRange:[0,1], outputRange:["0deg","45deg"] });
  const translateY = slide.interpolate({ inputRange:[0,1], outputRange:[16,0] });
  const opacity = slide.interpolate({ inputRange:[0,1], outputRange:[0,1] });

  const Btn = ({ icon, label, value }) => {
    const isActive = value === active;
    return (
      <Pressable
        onPress={() => onChange?.(value)}
        style={{ alignItems: "center", flex: 1, paddingVertical: spacing.sm }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? colors.accent.primary : colors.text.muted}
        />
        <TText size="sm" dim={!isActive}>{label}</TText>
      </Pressable>
    );
  };

  const baseBarPaddingBottom = insets.bottom + spacing.sm;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
      {/* Expanded action row is ABSOLUTE above the base bar → doesn't change layout height */}
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: TRIP_BAR_BASE_HEIGHT + baseBarPaddingBottom, // sit above base
          transform: [{ translateY }],
          opacity,
          flexDirection: "row",
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
        }}
      >
        {[
          { key:"upload",  icon:"cloud-upload", label:"Upload" },
          { key:"arrange", icon:"reorder-three", label:"Arrange" },
          { key:"invite",  icon:"person-add", label:"Invite" },
        ].map(a => (
          <Pressable
            key={a.key}
            onPress={() => { setExpanded(false); onAction?.(a.key); }}
            style={{
              flex:1, alignItems:"center", paddingVertical: spacing.sm,
              borderWidth:1, borderColor: colors.border, borderRadius: radii.lg,
              backgroundColor: colors.bg.layer1
            }}
          >
            <Ionicons name={a.icon} size={18} color={colors.text.primary} />
            <TText size="sm" style={{ marginTop: 4 }}>{a.label}</TText>
          </Pressable>
        ))}
      </Animated.View>

      {/* Base bar (this is the only height screens should reserve for) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: baseBarPaddingBottom,
          backgroundColor: colors.bg.layer2,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: TRIP_BAR_BASE_HEIGHT + baseBarPaddingBottom, // fixed base height
        }}
      >
        <Btn icon="albums"   label="Timeline" value="timeline" />
        <Btn icon="list"     label="Activity" value="activity" />
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={{ alignItems: "center", justifyContent: "center", padding: spacing.sm, marginHorizontal: spacing.md }}
        >
          <Animated.View style={{ transform:[{ rotate: spin }] }}>
            <Ionicons name="add-circle" size={32} color={colors.accent.primary} />
          </Animated.View>
        </Pressable>
        <Btn icon="images"   label="Gallery"  value="gallery" />
        <Btn icon="settings" label="Settings" value="settings" />
      </View>
    </View>
  );
}
