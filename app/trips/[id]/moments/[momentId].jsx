import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ActivityIndicator, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import PageMiniHeader from "../../../../src/components/PageMiniHeader";
import MomentCollage from "../../../../src/components/trips/MomentCollage";
import TText from "../../../../src/components/TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { spacing } from "../../../../src/theme/spacing";
import { useTheme } from "../../../../src/theme";
import { fetchTripById } from "../../../../src/data/trips";
import SafeBottomBar from "../../../../src/components/SafeBottomBar";

export default function MomentScreen() {
  const { id, momentId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelH, setPanelH] = useState(96);  // measured height of bottom panel

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

  const moment = useMemo(
    () => (trip?.moments || []).find(m => m.id === String(momentId)),
    [trip, momentId]
  );

  const media = useMemo(() => {
    const byId = Object.fromEntries((trip?.media || []).map(m => [m.id, m]));
    return (moment?.mediaIds || []).map(mid => byId[mid]).filter(Boolean);
  }, [trip, moment]);

  const onOpenMedia = (m) => router.push(`/trips/${id}/moments/${momentId}/media/${m.id}`);

  if (loading || !moment) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <PageMiniHeader
        bgUri={trip.coverUri}
        title={moment.title || "Moment"}
        subtitle={trip.title || ""}
      />

      {/* Collage is the ONLY scrollable region on this screen */}
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: panelH + 8 }}
        overScrollMode="never"
      >
        <MomentCollage media={media} onOpen={onOpenMedia} />
      </ScrollView>

      {/* Bottom fixed info panel */}
      <View
        onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          backgroundColor: colors.bg.layer1,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs }}>
          <TText weight="bold" style={{ fontSize: 18, flex: 1, marginRight: spacing.md }} numberOfLines={2}>
            {moment.title}
          </TText>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md }}>
              <Ionicons name="heart-outline" size={18} color={colors.text.primary} />
              <TText dim size="sm" style={{ marginLeft: 4 }}>24</TText>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/trips/${id}/moments/${momentId}/comments`)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.text.primary} />
              <TText dim size="sm" style={{ marginLeft: 4 }}>12</TText>
            </Pressable>
          </View>
        </View>

        {!!moment.description && (
          <TText dim style={{ marginTop: 6, marginBottom: 8 }}>
            {moment.description}
          </TText>
        )}

        {/* Pure inset spacer (empty bar) */}
        <SafeBottomBar backgroundColor={colors.bg.layer1} />
      </View>
    </View>
  );
}
