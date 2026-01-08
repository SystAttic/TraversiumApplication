import React from "react";
import { View, Pressable } from "react-native";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";
import TText from "../TText";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function UnorganizedMediaBanner({ count, onSortPress }) {
  const { colors } = useTheme();

  if (!count || count === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.bg.layer2,
        borderWidth: 1,
        borderColor: colors.status.warning,
        borderRadius: radii.md,
        padding: spacing.md,
        marginTop: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Warning Icon */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.sm,
            backgroundColor: colors.status.warning + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
            marginTop: 2,
          }}
        >
          <Ionicons name="warning-outline" size={18} color={colors.status.warning} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <TText size="sm" weight="semibold" style={{ color: colors.text.primary, marginBottom: 2 }}>
            You have {count} unorganized photo{count !== 1 ? "s" : ""}
          </TText>
          <TText size="sm" style={{ color: colors.text.muted, lineHeight: 18 }}>
            These photos are not visible in timelines.
          </TText>
        </View>

        {/* Sort Now Button */}
        <Pressable
          onPress={onSortPress}
          style={{
            backgroundColor: colors.status.warning,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.sm,
            marginLeft: spacing.md,
            alignSelf: "flex-start",
          }}
        >
          <TText size="sm" weight="semibold" style={{ color: "#FFFFFF" }}>
            Sort Now
          </TText>
        </Pressable>
      </View>
    </View>
  );
}

