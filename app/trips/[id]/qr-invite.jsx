import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchTripById } from "../../../src/data/trips";
import PageMiniHeader from "../../../src/components/PageMiniHeader";
import TText from "../../../src/components/TText";
import Card from "../../../src/components/Card";
import { spacing, radii } from "../../../src/theme/spacing";
import { useTheme } from "../../../src/theme";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const QR_SIZE = Math.min(SCREEN_WIDTH - spacing.xl * 2, 280);

export default function QRInviteScreen() {
  const { id, role } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      const t = await fetchTripById(String(id || "t1"));
      if (!on) return;
      setTrip(t);
      setLoading(false);
    })();
    return () => { on = false; };
  }, [id]);

  const inviteRole = role === "viewer" ? "viewer" : "collaborator";
  
  // Mock QR code data - in production this would be a real QR code
  const qrData = trip ? JSON.stringify({ 
    tripId: trip.id, 
    role: inviteRole 
  }) : null;

  if (loading || !trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.layer1, alignItems: "center", justifyContent: "center" }}>
        <TText>Loading...</TText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <PageMiniHeader
        bgUri={trip.coverUri}
        title="Invite to Trip"
        subtitle={trip.title || ""}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ padding: spacing.xl, alignItems: "center" }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.md, textAlign: "center" }}>
            {trip.title || "Untitled Trip"}
          </TText>

          <TText dim size="sm" style={{ marginBottom: spacing.lg, textAlign: "center" }}>
            Scan to join as {inviteRole === "collaborator" ? "collaborator" : "viewer"}
          </TText>

          {/* Mock QR Code */}
          <View
            style={{
              width: QR_SIZE,
              height: QR_SIZE,
              borderWidth: 2,
              borderColor: colors.border,
              borderRadius: radii.md,
              backgroundColor: colors.bg.layer2,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Ionicons 
              name="qr-code-outline" 
              size={QR_SIZE * 0.6} 
              color={colors.text.primary} 
            />
          </View>

          <View
            style={{
              backgroundColor: colors.bg.layer3,
              borderRadius: radii.sm,
              padding: spacing.md,
              width: "100%",
              marginBottom: spacing.md,
            }}
          >
            <TText dim size="xs" style={{ marginBottom: spacing.xs }}>
              QR Code Data (for testing):
            </TText>
            <TText size="xs" style={{ fontFamily: "monospace" }}>
              {qrData || "Loading..."}
            </TText>
          </View>

          <TText dim size="sm" style={{ textAlign: "center" }}>
            Share this QR code with others to invite them to this trip as a {inviteRole}.
          </TText>
        </Card>
      </ScrollView>
    </View>
  );
}

