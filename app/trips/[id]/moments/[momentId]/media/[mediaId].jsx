import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, Pressable, TouchableWithoutFeedback } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { fetchTripById } from "../../../../../../src/data/trips";
import TText from "../../../../../../src/components/TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const UI_HIDE_AFTER = 2500;

export default function MediaViewer() {
  const { id, momentId, mediaId } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState(null);
  const [index, setIndex] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const t = await fetchTripById(String(id || "t1"));
      if (!on) return;
      setTrip(t);
    })();
    return () => { on = false; };
  }, [id]);

  const moment = useMemo(() => (trip?.moments || []).find(m => m.id === String(momentId)), [trip, momentId]);

  const media = useMemo(() => {
    if (!trip || !moment) return [];
    const byId = Object.fromEntries((trip.media || []).map(m => [m.id, m]));
    return (moment.mediaIds || []).map(mid => byId[mid]).filter(Boolean);
  }, [trip, moment]);

  useEffect(() => {
    if (!media.length) return;
    const idx = Math.max(0, media.findIndex(m => m.id === String(mediaId)));
    setIndex(idx === -1 ? 0 : idx);
  }, [media, mediaId]);

  const current = media[index];

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowUI(false), UI_HIDE_AFTER);
  };

  // auto-hide after open
  useEffect(() => {
    setShowUI(true);
    scheduleHide();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [index]);

  const toggleUI = () => {
    const next = !showUI;
    setShowUI(next);
    if (next) scheduleHide();
  };

  const prev = () => { if (index > 0) setIndex(index - 1); };
  const nextM = () => { if (index < media.length - 1) setIndex(index + 1); };

  if (!current) {
    return <View style={{ flex:1, backgroundColor: "black" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* tap to toggle UI */}
      <TouchableWithoutFeedback onPress={toggleUI}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: current.uri }}
            style={{ width: "100%", height: "100%", resizeMode: "contain" }}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* top bar */}
      {showUI && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems:"center", justifyContent:"center",
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>

          <TText style={{ color: "#fff" }}>
            {index + 1} / {media.length}
          </TText>

          <View style={{ width: 36, height: 36 }} />
        </View>
      )}

      {/* side arrows */}
      {showUI && (
        <>
          <Pressable
            onPress={prev}
            disabled={index === 0}
            style={{
              position: "absolute", left: 8, top: "50%", marginTop: -24,
              width: 48, height: 48, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems:"center", justifyContent:"center",
              opacity: index === 0 ? 0.4 : 1,
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Pressable
            onPress={nextM}
            disabled={index >= media.length - 1}
            style={{
              position: "absolute", right: 8, top: "50%", marginTop: -24,
              width: 48, height: 48, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems:"center", justifyContent:"center",
              opacity: index >= media.length - 1 ? 0.4 : 1,
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        </>
      )}

      {/* bottom author */}
      {showUI && (
        <View style={{ position: "absolute", left: 12, right: 12, bottom: insets.bottom + 10 }}>
          <TText style={{ color: "#fff" }}>
            {/* Mock: there’s no author in mock data, so show trip/moment; wire real author later */}
            {moment?.title} — {current.id}
          </TText>
        </View>
      )}
    </View>
  );
}
