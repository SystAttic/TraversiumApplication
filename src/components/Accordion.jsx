import React, { useState } from "react";
import { View, Pressable, Animated } from "react-native";
import { useTheme } from "../theme";
import { spacing, radii } from "../theme/spacing";
import TText from "./TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import Card from "./Card";

export default function Accordion({ 
  title, 
  children, 
  defaultExpanded = false,
  icon,
  style 
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [animation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Card style={[{ marginBottom: spacing.md }, style]}>
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
          {icon && (
            <Ionicons name={icon} size={20} color={colors.accent.primary} />
          )}
          <TText weight="bold" size="md" style={{ flex: 1 }}>
            {title}
          </TText>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colors.text.secondary || colors.text.primary} 
          />
        </Animated.View>
      </Pressable>
      
      <Animated.View
        style={{
          maxHeight,
          opacity,
          overflow: "hidden",
        }}
      >
        <View style={{ paddingTop: spacing.md }}>
          {children}
        </View>
      </Animated.View>
    </Card>
  );
}
