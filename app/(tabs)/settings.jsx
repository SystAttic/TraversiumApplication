import React from "react";
import { View } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";

export default function SettingsScreen() {
  const { colors, mode, setMode, isDark } = useTheme();

  const toggle = () => {
    setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system");
  };

  return (
    <Screen>
      <AppHeader title="Settings" />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          <TText weight="bold" size="lg">Appearance</TText>
          <TText dim style={{ marginTop: 6 }}>
            Current: {mode.toUpperCase()} ({isDark ? "dark" : "light"})
          </TText>
          <Button title="Cycle Theme (system → light → dark)" style={{ marginTop: spacing.lg }} onPress={toggle} />
        </Card>

        <Card inset>
          <TText weight="bold">About</TText>
          <TText dim style={{ marginTop: 6 }}>
            Traversium • v0.1.0
          </TText>
        </Card>
      </View>
    </Screen>
  );
}
