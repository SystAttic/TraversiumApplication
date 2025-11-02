import React from "react";
import { View, TextInput } from "react-native";
import { useTheme } from "../theme";
import TText from "./TText";
import { spacing, radii } from "../theme/spacing";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
  error,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const borderColor = error ? (colors?.danger || "#c33") : colors.border;

  return (
    <View style={{ gap: 6, marginBottom: spacing.md }}>
      {label ? <TText weight="medium">{label}</TText> : null}
      <View
        style={{
          backgroundColor: colors.bg.layer2,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: spacing.lg,
          paddingVertical: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          style={[{ color: colors.text.primary, paddingVertical: 4 }, style]}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          {...rest}
        />
      </View>
      {error ? <TText size="sm" style={{ color: colors?.danger || "#c33" }}>{error}</TText> : null}
    </View>
  );
}
