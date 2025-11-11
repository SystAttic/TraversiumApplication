import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";

export default function FloatingActionButton({ 
  icon = "add", 
  onPress, 
  size = 56,
  style,
  ...rest 
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent.primary,
          bottom: spacing.xl,
          right: spacing.xl,
          shadowColor: colors.accent.primary,
        },
        style,
      ]}
      hitSlop={8}
      {...rest}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

