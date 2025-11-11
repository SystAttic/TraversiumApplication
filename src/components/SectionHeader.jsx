import React from "react";
import { View } from "react-native";
import TText from "./TText";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";

export default function SectionHeader({ title, subtitle, rightAction }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ flex: 1 }}>
        <TText weight="bold" size="lg">
          {title}
        </TText>
        {subtitle && (
          <TText dim size="sm" style={{ marginTop: spacing.xs }}>
            {subtitle}
          </TText>
        )}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}

