// src/components/trips/TripBottomBar.jsx
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";
import TText from "../TText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "../BottomSheet";

// Export a constant so screens can reserve space for the base (non-extendable) bar only
export const TRIP_BAR_BASE_HEIGHT = 56;

export default function TripBottomBar({ active="timeline", onChange, onAction }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showActionsSheet, setShowActionsSheet] = useState(false);

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

  const handleAction = (key) => {
    setShowActionsSheet(false);
    onAction?.(key);
  };

  const ActionButton = ({ icon, label, onPress }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.lg,
        backgroundColor: colors.bg.layer2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.accent.primary + "22",
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <Ionicons name={icon} size={24} color={colors.accent.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <TText weight="bold">{label}</TText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
    </Pressable>
  );

  return (
    <>
      {/* Base bar (this is the only height screens should reserve for) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom,
          backgroundColor: colors.bg.layer2,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: TRIP_BAR_BASE_HEIGHT + insets.bottom,
        }}
      >
        <Btn icon="albums"   label="Timeline" value="timeline" />
        <Btn icon="images"   label="Gallery"  value="gallery" />
        <Pressable
          onPress={() => setShowActionsSheet(true)}
          style={{ alignItems: "center", justifyContent: "center", padding: spacing.sm, marginHorizontal: spacing.md }}
        >
          <Ionicons name="add-circle" size={32} color={colors.accent.primary} />
        </Pressable>
        <Btn icon="list"     label="Activity" value="activity" />
        <Btn icon="settings" label="Settings" value="settings" />
      </View>

      {/* Actions Bottom Sheet */}
      <BottomSheet visible={showActionsSheet} onClose={() => setShowActionsSheet(false)} maxHeight="40%">
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
            Trip Actions
          </TText>

          <ActionButton
            icon="cloud-upload"
            label="Upload media"
            onPress={() => handleAction("upload")}
          />

          <ActionButton
            icon="reorder-three"
            label="Arrange moments"
            onPress={() => handleAction("arrange")}
          />
        </View>
      </BottomSheet>
    </>
  );
}
