import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import TText from "../TText";
import BottomSheet from "../BottomSheet";
import Ionicons from "@expo/vector-icons/Ionicons";

const GENDER_OPTIONS = [
  { value: "male", label: "Male", icon: "male-outline" },
  { value: "female", label: "Female", icon: "female-outline" },
  { value: "secret", label: "It's a secret", icon: "lock-closed-outline" },
];

export default function GenderPickerSheet({ visible, onClose, onConfirm, initialValue }) {
  const { colors } = useTheme();

  const handleSelect = (value) => {
    onConfirm(value);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="50%">
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <TText weight="bold" style={{ fontSize: 22, marginBottom: spacing.xl, color: colors.text.primary }}>
          Select Gender
        </TText>

        <View style={{ gap: spacing.md }}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = initialValue === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: spacing.lg,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.accent.primary : colors.border,
                  backgroundColor: isSelected ? colors.bg.layer2 : colors.bg.layer1,
                  gap: spacing.md,
                  minHeight: 56,
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={isSelected ? colors.accent.primary : colors.text.primary}
                />
                <TText
                  weight={isSelected ? "bold" : "normal"}
                  style={{
                    fontSize: 18,
                    color: isSelected ? colors.accent.primary : colors.text.primary,
                    flex: 1,
                  }}
                >
                  {option.label}
                </TText>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

