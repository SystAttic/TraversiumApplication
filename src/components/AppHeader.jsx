import React from "react";
import { View, Pressable } from "react-native";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";
import TText from "./TText";

export default function AppHeader({ title }) {
  const { colors, mode, setMode, isDark } = useTheme();

  const cycleMode = () => {
    setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system");
  };

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.bg.layer1,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TText weight="bold" size="lg">{title}</TText>
      <Pressable onPress={cycleMode}>
        <TText dim>{mode.toUpperCase()}</TText>
      </Pressable>
    </View>
  );
}
