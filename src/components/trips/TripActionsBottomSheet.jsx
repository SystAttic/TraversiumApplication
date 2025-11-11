import React from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "../BottomSheet";
import TText from "../TText";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";

export default function TripActionsBottomSheet({ visible, onClose, onCreateTrip, onJoinByQR }) {
  const { colors } = useTheme();

  const ActionButton = ({ icon, label, onPress }) => (
    <Pressable
      onPress={() => {
        onPress();
        onClose();
      }}
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
    <BottomSheet visible={visible} onClose={onClose} maxHeight="40%">
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
          Trip Actions
        </TText>

        <ActionButton
          icon="add-circle"
          label="Create new trip"
          onPress={onCreateTrip}
        />

        <ActionButton
          icon="qr-code"
          label="Join trip by QR"
          onPress={onJoinByQR}
        />
      </View>
    </BottomSheet>
  );
}

