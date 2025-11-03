// app/trips/[id]/index.jsx
import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Animated, ImageBackground, Pressable } from "react-native";
import TripMiniHeader from "../../../src/components/trips/TripMiniHeader";
import TripActivity from "../../../src/components/trips/TripActivity";
import GalleryMasonry from "../../../src/components/trips/GalleryMasonry";
import TripSettings from "../../../src/components/trips/TripSettings";
import TripBottomBar, { TRIP_BAR_BASE_HEIGHT } from "../../../src/components/trips/TripBottomBar";
import { useLocalSearchParams } from "expo-router";
import { fetchTripById } from "../../../src/data/trips";
import { spacing } from "../../../src/theme/spacing";
import TText from "../../../src/components/TText";
import { useTheme } from "../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import MomentCard from "../../../src/components/trips/MomentCard";

const COVER_H = 260; // big header height

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState(null);
  const [active, setActive] = useState("timeline"); // timeline | activity | gallery | settings
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      const data = await fetchTripById(String(id || "t1"));
      if (on) { setTrip(data); setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  if (loading || !trip) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const mediaById = Object.fromEntries((trip.media || []).map(m => [m.id, m]));

  // Fade mini header in after scrolling past the cover
  const miniOpacity = scrollY.interpolate({
    inputRange: [COVER_H - 40, COVER_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      {active === "timeline" ? (
        <>
          {/* Absolute big cover header */}
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: COVER_H,
              backgroundColor: colors.bg.layer3,
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <ImageBackground
              source={{ uri: trip.coverUri }}
              style={{ flex: 1 }}
              imageStyle={{ opacity: 0.95 }}
            >
              {/* Back + Share over cover */}
              <View
                style={{
                  paddingTop: insets.top + 8,
                  paddingHorizontal: spacing.xl,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <RoundBtn icon="arrow-back" onPress={() => router.back()} colors={colors} />
                <RoundBtn icon="share-social" onPress={() => { /* copy link */ }} colors={colors} />
              </View>

              {/* Title near bottom */}
              <View style={{ position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.lg }}>
                <TText weight="bold" style={{ fontSize: 30 }} numberOfLines={2} adjustsFontSizeToFit>
                  {trip.title || "Trip"}
                </TText>
              </View>
            </ImageBackground>
          </View>

          {/* Mini header pinned (full width, flush top), only visible after cover */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              opacity: miniOpacity,
              zIndex: 2,
            }}
            pointerEvents="none"
          >
            {/* TripMiniHeader has its own safe-area top padding */}
            <TripMiniHeader trip={trip} />
          </Animated.View>

          {/* Timeline content below cover; nothing overlays the status bar now */}
          <Animated.FlatList
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            data={trip.moments || []}
            keyExtractor={(m) => m.id}
            ListHeaderComponent={
              <View
                style={{
                  paddingTop: COVER_H,
                  paddingHorizontal: spacing.xl,
                  paddingBottom: spacing.md,
                  backgroundColor: colors.bg.layer1,
                }}
              >
                <View style={{ gap: 4 }}>
                  <TText dim>{trip.description}</TText>
                  <TText dim>{trip.stats?.moments || 0} moments · {trip.stats?.media || 0} media</TText>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
                <MomentCard moment={item} mediaById={mediaById} onOpen={() => {}} />
              </View>
            )}
            ListEmptyComponent={() => <TText dim style={{ padding: spacing.xl }}>No moments yet.</TText>}
            contentContainerStyle={{
              paddingBottom: TRIP_BAR_BASE_HEIGHT + insets.bottom + spacing.lg, // base bar only
            }}
          />
        </>
      ) : (
        <>
          {/* Pinned mini header for other tabs */}
          <TripMiniHeader trip={trip} />
          {active === "activity" && <TripActivity tripId={trip.id} enabled />}
          {active === "gallery"  && <GalleryMasonry media={trip.media} onOpen={() => {}} />}
          {active === "settings" && <TripSettings trip={trip} />}
        </>
      )}

      {/* Base bottom bar is absolutely positioned; content reserved base height only */}
      <TripBottomBar active={active} onChange={setActive} onAction={() => {}} />
    </View>
  );
}

function RoundBtn({ icon, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 38, height: 38, borderRadius: 999,
        alignItems:"center", justifyContent:"center",
        backgroundColor: colors.bg.layer1, opacity: 0.92,
        borderWidth:1, borderColor: colors.border,
      }}
      hitSlop={8}
    >
      <Ionicons name={icon} size={18} color={colors.text.primary} />
    </Pressable>
  );
}
