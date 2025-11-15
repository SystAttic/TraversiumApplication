import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, Pressable, FlatList, Dimensions, TouchableWithoutFeedback } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { fetchTripById } from "../../../../../../src/data/trips";
import TText from "../../../../../../src/components/TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../../../../../src/theme/spacing";

const UI_HIDE_AFTER = 2500;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper to format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function MediaViewer() {
  const { id, momentId, mediaId } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState(null);
  const [index, setIndex] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const timer = useRef(null);
  const flatListRef = useRef(null);
  const indexRef = useRef(0);
  const isScrollingProgrammatically = useRef(false);
  const mediaLengthRef = useRef(0);

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

  // Update media length ref
  useEffect(() => {
    mediaLengthRef.current = media.length;
  }, [media.length]);

  // Calculate initial index
  const initialIndex = useMemo(() => {
    if (!media.length) return 0;
    const idx = media.findIndex(m => m.id === String(mediaId));
    return idx >= 0 ? idx : 0;
  }, [media, mediaId]);

  // Set initial index on mount
  useEffect(() => {
    if (initialIndex !== index) {
      setIndex(initialIndex);
      indexRef.current = initialIndex;
    }
  }, [initialIndex]);

  const current = media[index];

  // Get uploader info for current media
  const uploaderInfo = useMemo(() => {
    if (!current?.uploader || !trip?.collaborators) return null;
    const uploader = trip.collaborators.find(u => u.id === current.uploader) || 
                     trip.collaborators[0];
    return uploader;
  }, [current, trip]);

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

  const prev = () => { 
    if (index > 0) {
      isScrollingProgrammatically.current = true;
      const newIndex = index - 1;
      setIndex(newIndex);
      indexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 300);
    }
  };
  
  const nextM = () => { 
    if (index < media.length - 1) {
      isScrollingProgrammatically.current = true;
      const newIndex = index + 1;
      setIndex(newIndex);
      indexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 300);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    // Ignore updates during programmatic scrolling
    if (isScrollingProgrammatically.current) return;
    
    if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== undefined) {
      const newIndex = viewableItems[0].index;
      // Only update if it's actually different to avoid unnecessary re-renders
      if (newIndex !== indexRef.current && newIndex >= 0 && newIndex < mediaLengthRef.current) {
        indexRef.current = newIndex;
        setIndex(newIndex);
      }
    }
  }).current;

  // Update indexRef when index changes
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 0,
  }).current;

  // Fallback: Update index on scroll end
  const onMomentumScrollEnd = useRef((event) => {
    if (isScrollingProgrammatically.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    
    if (newIndex !== indexRef.current && newIndex >= 0 && newIndex < mediaLengthRef.current) {
      indexRef.current = newIndex;
      setIndex(newIndex);
    }
  }).current;

  if (!current) {
    return <View style={{ flex: 1, backgroundColor: "black" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Swipeable image list */}
      <FlatList
        ref={flatListRef}
        data={media}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableWithoutFeedback onPress={toggleUI}>
            <View style={{ width: SCREEN_WIDTH, height: "100%", alignItems: "center", justifyContent: "center" }}>
              <Image
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              />
            </View>
          </TouchableWithoutFeedback>
        )}
        scrollEnabled={true}
      />

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
            zIndex: 10,
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
              zIndex: 10,
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
              zIndex: 10,
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        </>
      )}

      {/* bottom uploader info */}
      {showUI && current && (
        <View style={{ 
          position: "absolute", 
          left: spacing.md, 
          right: spacing.md, 
          bottom: insets.bottom + spacing.md,
          flexDirection: "row",
          alignItems: "center",
          zIndex: 10,
        }}>
          {uploaderInfo && (
            <>
              <Image
                source={{ 
                  uri: uploaderInfo.avatar || uploaderInfo.avatarPhotoReference || "https://i.pravatar.cc/100?img=1"
                }}
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16,
                  marginRight: spacing.sm,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              />
              <View style={{ flex: 1 }}>
                <TText style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
                  {uploaderInfo.displayName || uploaderInfo.username || "Unknown"}
                </TText>
                {current.createdAt && (
                  <TText style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                    {formatTime(current.createdAt)}
                  </TText>
                )}
              </View>
            </>
          )}
          {!uploaderInfo && current.createdAt && (
            <TText style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {formatTime(current.createdAt)}
            </TText>
          )}
        </View>
      )}
    </View>
  );
}
