import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";

export default function AuthCard({ children, style }) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const up = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(up, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: spacing.xl,
          borderRadius: radii.lg,
          backgroundColor: colors.bg.layer1,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.xl,
          minHeight: 520,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 3,
          transform: [{ translateY: up }],
          opacity: fade,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
