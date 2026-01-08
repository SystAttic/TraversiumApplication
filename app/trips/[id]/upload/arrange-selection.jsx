import React from "react";
import { View, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Screen from "../../../../src/components/Screen";
import AppHeader from "../../../../src/components/AppHeader";
import Card from "../../../../src/components/Card";
import TText from "../../../../src/components/TText";
import { useTheme } from "../../../../src/theme";
import { spacing, radii } from "../../../../src/theme/spacing";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ArrangeSelectionScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { colors } = useTheme();

  const finalTripId = Array.isArray(tripId) ? tripId[0] : tripId;

  const handleManualArrange = () => {
    router.push(`/trips/${finalTripId}/upload/manual-arrange`);
  };

  const handleAutoArrange = () => {
    router.push(`/trips/${finalTripId}/upload/auto-arrange`);
  };

  return (
    <Screen>
      <AppHeader title="Organize Photos" showBell={false} />
      <View style={{ flex: 1, padding: spacing.xl }}>
        <TText size="lg" weight="semibold" style={{ marginBottom: spacing.xs }}>
          Choose how to organize your photos
        </TText>
        <TText dim style={{ marginBottom: spacing.xl }}>
          Select a method to organize your unorganized photos into moments.
        </TText>

        <View style={{ gap: spacing.lg }}>
          {/* Manual Arrange Option */}
          <Pressable onPress={handleManualArrange}>
            <Card style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radii.md,
                    backgroundColor: colors.accent.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Ionicons name="grid-outline" size={24} color={colors.accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <TText weight="semibold" size="md" style={{ marginBottom: spacing.xs }}>
                    Manual Arrange
                  </TText>
                  <TText dim size="sm" style={{ lineHeight: 20 }}>
                    Manually organize photos by assigning them to existing moments or creating new ones. You have full control over the organization.
                  </TText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} style={{ marginLeft: spacing.sm }} />
              </View>
            </Card>
          </Pressable>

          {/* Auto Arrange Option */}
          <Pressable onPress={handleAutoArrange}>
            <Card style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radii.md,
                    backgroundColor: colors.status.info + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Ionicons name="sparkles-outline" size={24} color={colors.status.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <TText weight="semibold" size="md" style={{ marginBottom: spacing.xs }}>
                    Auto Arrange
                  </TText>
                  <TText dim size="sm" style={{ lineHeight: 20 }}>
                    Automatically organize photos into moments based on location, time, and other metadata. Quick and effortless.
                  </TText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} style={{ marginLeft: spacing.sm }} />
              </View>
            </Card>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

