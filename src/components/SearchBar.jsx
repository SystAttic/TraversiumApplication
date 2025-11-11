import React from "react";
import { View, TextInput, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme";
import { spacing, radii } from "../theme/spacing";

export default function SearchBar({ value, onChangeText, placeholder = "Search...", onClear, onFilterPress, showFilterButton = false }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bg.layer2,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      }}
    >
      <Ionicons name="search" size={20} color={colors.text.muted} style={{ marginRight: spacing.sm }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={{ flex: 1, color: colors.text.primary, paddingVertical: 4 }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value && value.length > 0 && (
        <Pressable onPress={() => { onChangeText(""); onClear?.(); }} hitSlop={8} style={{ marginRight: spacing.xs }}>
          <Ionicons name="close-circle" size={20} color={colors.text.muted} />
        </Pressable>
      )}
      {showFilterButton && (
        <Pressable onPress={onFilterPress} hitSlop={8}>
          <Ionicons name="filter" size={20} color={colors.text.primary} />
        </Pressable>
      )}
    </View>
  );
}

