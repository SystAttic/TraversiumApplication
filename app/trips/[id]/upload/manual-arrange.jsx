import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../../../src/components/Screen";
import AppHeader from "../../../../src/components/AppHeader";
import TText from "../../../../src/components/TText";
import { useTheme } from "../../../../src/theme";
import { spacing } from "../../../../src/theme/spacing";

export default function ManualArrangeScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { colors } = useTheme();

  return (
    <Screen>
      <AppHeader title="Manual Moment Arrangement" showBell={false} />
      <View style={{ flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" }}>
        <TText dim style={{ textAlign: "center" }}>
          Manual Moment Arrangement screen coming soon...
        </TText>
        <TText dim size="sm" style={{ marginTop: spacing.md, textAlign: "center" }}>
          Trip ID: {tripId}
        </TText>
      </View>
    </Screen>
  );
}

