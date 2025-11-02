import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme";

export default function Skeleton({ height = 12, width = "100%", radius = 8, style }) {
  const { isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const base = isDark
    ? ["#1a1d22", "#20242a", "#1a1d22"]
    : ["#EDEEF0", "#F6F7F8", "#EDEEF0"];

  return (
    <View style={[{ overflow: "hidden", borderRadius: radius, width, height }, style]}>
      <Animated.View style={{ flex: 1 }}>
        <LinearGradient
          colors={base}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
