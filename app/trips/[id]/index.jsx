// app/trips/[id]/index.jsx
import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Animated, ImageBackground, Pressable } from "react-native";
import TripMiniHeader from "../../../src/components/trips/TripMiniHeader";
import TripActivity from "../../../src/components/trips/TripActivity";
import GalleryMasonry from "../../../src/components/trips/GalleryMasonry";
import TripSettings from "../../../src/components/trips/TripSettings";
import TripBottomBar, { TRIP_BAR_BASE_HEIGHT } from "../../../src/components/trips/TripBottomBar";
import { useLocalSearchParams } from "expo-router";
import { getTripById } from "../../../src/services/tripApi";
import { getMediaFileUrl } from "../../../src/services/fileStorageApi";
import { auth } from "../../../src/services/firebase";
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
      try {
        setLoading(true);
        const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
        if (!tripIdNum || isNaN(tripIdNum)) {
          console.error("Invalid trip ID:", id);
          return;
        }
        
        const tripData = await getTripById(tripIdNum);
        if (!on) return;
        
        // Transform API response to UI format
        const currentUserId = auth.currentUser?.uid || null;
        const isCollaborator = tripData.collaborators?.includes(currentUserId) || false;
        const isOwner = tripData.ownerId === currentUserId;
        
        // Flatten media from all albums
        const allMedia = [];
        const moments = [];
        
        tripData.albums?.forEach((album) => {
          // Skip default album for moments list
          if (album.albumId === tripData.defaultAlbum) {
            // Add media from default album to allMedia
            album.media?.forEach((m) => {
              allMedia.push({
                id: String(m.mediaId),
                uri: getMediaFileUrl(m.pathUrl),
                uploader: m.uploader,
                createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
              });
            });
          } else {
            // Create moment from album
            const albumMedia = album.media || [];
            const coverMedia = albumMedia[0];
            moments.push({
              id: String(album.albumId),
              title: album.title || "Untitled Moment",
              description: album.description || "",
              coverUri: coverMedia ? getMediaFileUrl(coverMedia.pathUrl) : null,
              mediaIds: albumMedia.map((m) => String(m.mediaId)),
              createdBy: coverMedia?.uploader || tripData.ownerId,
              createdAt: album.createdAt ? new Date(album.createdAt).getTime() : Date.now(),
            });
            
            // Add media from this album
            albumMedia.forEach((m) => {
              allMedia.push({
                id: String(m.mediaId),
                uri: getMediaFileUrl(m.pathUrl),
                uploader: m.uploader,
                createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
              });
            });
          }
        });
        
        // Transform collaborators/viewers (for now just IDs, will need user API later)
        const collaborators = tripData.collaborators?.map((firebaseId) => ({
          id: firebaseId,
          username: firebaseId, // Placeholder
          displayName: firebaseId, // Placeholder
        })) || [];
        
        const viewers = tripData.viewers?.map((firebaseId) => ({
          id: firebaseId,
          username: firebaseId, // Placeholder
          displayName: firebaseId, // Placeholder
        })) || [];
        
        const transformedTrip = {
          id: String(tripData.tripId),
          tripId: tripData.tripId,
          title: tripData.title || "",
          description: tripData.description || "",
          coverUri: tripData.coverPhotoUrl || null,
          visibility: tripData.visibility || "PRIVATE",
          ownerId: tripData.ownerId,
          currentUserId,
          isCollaborator: isCollaborator || isOwner,
          isViewer: !isCollaborator && !isOwner,
          collaborators,
          viewers,
          media: allMedia,
          moments,
          stats: {
            moments: moments.length,
            media: allMedia.length,
          },
        };
        
        setTrip(transformedTrip);
      } catch (error) {
        console.error("Failed to load trip:", error);
      } finally {
        if (on) setLoading(false);
      }
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

  // Fade mini header in and hide big header after scrolling past the cover
  const miniOpacity = scrollY.interpolate({
    inputRange: [COVER_H - 40, COVER_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const coverTranslateY = scrollY.interpolate({
    inputRange: [0, COVER_H],
    outputRange: [0, -COVER_H],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      {active === "timeline" ? (
        <>
          {/* Absolute big cover header */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: COVER_H,
              backgroundColor: colors.bg.layer3,
              overflow: "hidden",
              zIndex: 1,
              transform: [{ translateY: coverTranslateY }],
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

              {/* Title and gradient overlay near bottom */}
              <View 
                style={{ 
                  position: "absolute", 
                  left: 0, 
                  right: 0, 
                  bottom: 0,
                  paddingTop: 60,
                  paddingHorizontal: spacing.xl,
                  paddingBottom: spacing.lg,
                  backgroundColor: "rgba(0,0,0,0.3)",
                }}
              >
                <TText weight="bold" style={{ fontSize: 32, color: "#fff" }} numberOfLines={2}>
                  {trip.title || "Trip"}
                </TText>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* Mini header pinned (full width, flush top), only visible after cover */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              opacity: miniOpacity,
              zIndex: 2,
            }}
            pointerEvents="box-none"
          >
            {/* TripMiniHeader has its own safe-area top padding */}
            <View style={{ opacity: 1 }}>
              <TripMiniHeader trip={trip} />
            </View>
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
                  paddingTop: COVER_H + spacing.lg,
                  paddingHorizontal: spacing.xl,
                  paddingBottom: spacing.lg,
                  backgroundColor: colors.bg.layer1,
                }}
              >
                {/* Description */}
                {!!trip.description && (
                  <TText dim style={{ marginBottom: spacing.md, lineHeight: 20 }}>
                    {trip.description}
                  </TText>
                )}

                {/* Stats and Info Row */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: spacing.md }}>
                  {/* Moments count */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md, marginBottom: spacing.xs }}>
                    <Ionicons name="albums-outline" size={16} color={colors.text.muted} />
                    <TText dim size="sm" style={{ marginLeft: 4 }}>{trip.stats?.moments || 0} moments</TText>
                  </View>

                  {/* Media count */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md, marginBottom: spacing.xs }}>
                    <Ionicons name="images-outline" size={16} color={colors.text.muted} />
                    <TText dim size="sm" style={{ marginLeft: 4 }}>{trip.stats?.media || 0} media</TText>
                  </View>

                  {/* Visibility */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md, marginBottom: spacing.xs }}>
                    <Ionicons 
                      name={trip.visibility === "PUBLIC" ? "globe-outline" : "lock-closed-outline"} 
                      size={16} 
                      color={colors.text.muted} 
                    />
                    <TText dim size="sm" style={{ marginLeft: 4 }}>{trip.visibility || "PRIVATE"}</TText>
                  </View>

                  {/* Collaborators count */}
                  {Array.isArray(trip.collaborators) && trip.collaborators.length > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md, marginBottom: spacing.xs }}>
                      <Ionicons name="people-outline" size={16} color={colors.text.muted} />
                      <TText dim size="sm" style={{ marginLeft: 4 }}>{trip.collaborators.length} collaborator{trip.collaborators.length !== 1 ? "s" : ""}</TText>
                    </View>
                  )}
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <MomentCard moment={item} mediaById={mediaById} onOpen={() => {
                  router.push(`/trips/${trip.id}/moments/${item.id}`);
                }} />
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
      <TripBottomBar 
        active={active} 
        onChange={setActive} 
        onAction={(action) => {
          if (action === "upload") {
            // Ensure id is a string (useLocalSearchParams can return array)
            const tripId = Array.isArray(id) ? id[0] : id;
            const finalId = String(tripId || trip?.id || trip?.tripId || "");
            if (finalId) {
              router.push(`/trips/${finalId}/upload`);
            } else {
              console.error("Cannot navigate to upload: no trip ID available");
            }
          }
        }} 
      />
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
