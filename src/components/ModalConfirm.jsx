import React from "react";
import { Modal, View, Pressable } from "react-native";
import TText from "./TText";
import Button from "./Button";
import { useTheme } from "../theme";
import { spacing, radii } from "../theme/spacing";

export default function ModalConfirm({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay || "rgba(0,0,0,0.4)",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
        onPress={onCancel}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.bg.layer2,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            overflow: "hidden",
          }}
          onStartShouldSetResponder={() => true}
        >
          {title ? <TText weight="bold" size="lg">{title}</TText> : null}
          {message ? <TText dim style={{ marginTop: spacing.sm }}>{message}</TText> : null}
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, justifyContent: "center" }}>
            <Button title={cancelText} variant="outline" onPress={onCancel} />
            <Button title={confirmText} onPress={onConfirm} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
