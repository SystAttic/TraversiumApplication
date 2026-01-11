// app/trips/[id]/index.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, ActivityIndicator, Animated, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppHeader from "../../../src/components/AppHeader";
import GalleryMasonry from "../../../src/components/trips/GalleryMasonry";
import TripSettings from "../../../src/components/trips/TripSettings";
import FloatingActionButton from "../../../src/components/FloatingActionButton";
import BottomSheet from "../../../src/components/BottomSheet";
import { useLocalSearchParams } from "expo-router";
import { getTripById } from "../../../src/services/tripApi";
import { getMediaFileUrl } from "../../../src/services/fileStorageApi";
import { auth } from "../../../src/services/firebase";
import AuthenticatedImageBackground from "../../../src/components/AuthenticatedImageBackground";
import { spacing, radii } from "../../../src/theme/spacing";
import TText from "../../../src/components/TText";
import { useTheme } from "../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import MomentCard from "../../../src/components/trips/MomentCard";
import UnorganizedMediaBanner from "../../../src/components/trips/UnorganizedMediaBanner";

const COVER_H = 260; // big header height

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState(null);
  const [active, setActive] = useState("timeline"); // timeline | gallery | settings
  const [loading, setLoading] = useState(true);
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Load trip data function
  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
      if (!tripIdNum || isNaN(tripIdNum)) {
        console.error("Invalid trip ID:", id);
        return;
      }
      
      const tripData = await getTripById(tripIdNum);
      
      // Transform API response to UI format
      const currentUserId = auth.currentUser?.uid || null;
      const isCollaborator = tripData.collaborators?.includes(currentUserId) || false;
      const isOwner = tripData.ownerId === currentUserId;
      
      // Flatten media from all albums
      const allMedia = [];
      const moments = [];
      let unorganizedMediaCount = 0;
      
      tripData.albums?.forEach((album) => {
        // Skip default album for moments list
        if (album.albumId === tripData.defaultAlbum) {
          // Count unorganized media (media in default album)
          const defaultAlbumMedia = album.media?.filter(m => m.pathUrl) || [];
          unorganizedMediaCount = defaultAlbumMedia.length;
          
          // Add media from default album to allMedia
          defaultAlbumMedia.forEach((m) => {
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
            if (!m.pathUrl) return; // Skip media without pathUrl
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
        coverUri: tripData.coverPhotoUrl ? getMediaFileUrl(tripData.coverPhotoUrl) : null,
        visibility: tripData.visibility || "PRIVATE",
        ownerId: tripData.ownerId,
        currentUserId,
        isCollaborator: isCollaborator || isOwner,
        isViewer: !isCollaborator && !isOwner,
        collaborators,
        viewers,
        media: allMedia,
        moments,
        unorganizedMediaCount,
        stats: {
          moments: moments.length,
          media: allMedia.length,
        },
      };
      
      setTrip(transformedTrip);
    } catch (error) {
      console.error("Failed to load trip:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load trip data on mount
  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Refresh trip data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTripData();
    }, [loadTripData])
  );

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

  // Create right element for AppHeader with navigation buttons
  const headerRightElement = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Pressable
        onPress={() => setActive("timeline")}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active === "timeline" ? colors.accent.primary + "22" : "transparent",
        }}
      >
        <Ionicons
          name="albums"
          size={20}
          color={active === "timeline" ? colors.accent.primary : colors.text.primary}
        />
      </Pressable>
      <Pressable
        onPress={() => setActive("gallery")}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active === "gallery" ? colors.accent.primary + "22" : "transparent",
        }}
      >
        <Ionicons
          name="images"
          size={20}
          color={active === "gallery" ? colors.accent.primary : colors.text.primary}
        />
      </Pressable>
      {/* Only show settings button if user is a collaborator */}
      {trip?.isCollaborator && (
        <Pressable
          onPress={() => setActive("settings")}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active === "settings" ? colors.accent.primary + "22" : "transparent",
          }}
        >
          <Ionicons
            name="settings"
            size={20}
            color={active === "settings" ? colors.accent.primary : colors.text.primary}
          />
        </Pressable>
      )}
    </View>
  );

  const handleFABPress = () => {
    setShowActionsSheet(true);
  };

  const handleAction = (action) => {
    setShowActionsSheet(false);
    if (action === "upload") {
      const tripId = Array.isArray(id) ? id[0] : id;
      const finalId = String(tripId || trip?.id || trip?.tripId || "");
      if (finalId) {
        router.push(`/trips/${finalId}/upload`);
      } else {
        console.error("Cannot navigate to upload: no trip ID available");
      }
    } else if (action === "arrange") {
      const tripId = Array.isArray(id) ? id[0] : id;
      router.push(`/trips/${tripId}/edit-moments`);
    } else if (action === "sortAll") {
      const tripId = Array.isArray(id) ? id[0] : id;
      router.push({
        pathname: `/trips/${tripId}/upload/manual-arrange`,
        params: { sortAll: "true" },
      });
    }
  };

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
            <AuthenticatedImageBackground
              source={{ uri: trip.coverUri }}
              style={{ flex: 1 }}
              imageStyle={{ opacity: 0.95 }}
            >
              {/* Back button and navigation buttons over cover */}
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <RoundBtn 
                    icon="images" 
                    onPress={() => setActive("gallery")} 
                    colors={colors}
                    isActive={active === "gallery"}
                  />
                  {/* Only show settings button if user is a collaborator */}
                  {trip?.isCollaborator && (
                    <RoundBtn 
                      icon="settings" 
                      onPress={() => setActive("settings")} 
                      colors={colors}
                      isActive={active === "settings"}
                    />
                  )}
                </View>
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
            </AuthenticatedImageBackground>
          </Animated.View>

          {/* AppHeader pinned (full width, flush top), only visible after cover */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              opacity: miniOpacity,
              zIndex: 2,
            }}
            pointerEvents="box-none"
          >
            <View style={{ opacity: 1 }}>
              <AppHeader title={trip.title || "Trip"} showBell={false} rightElement={headerRightElement} />
            </View>
          </Animated.View>

          {/* Timeline content below cover */}
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

                {/* Unorganized Media Banner - Only show for collaborators */}
                {trip?.isCollaborator && trip.unorganizedMediaCount > 0 && (
                  <UnorganizedMediaBanner
                    count={trip.unorganizedMediaCount}
                    onSortPress={() => {
                      const tripId = Array.isArray(id) ? id[0] : id;
                      router.push(`/trips/${tripId}/upload/arrange-selection`);
                    }}
                  />
                )}
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
              paddingBottom: insets.bottom + spacing.xl + 80, // space for FAB
            }}
          />

          {/* FAB overlay for timeline - Only show for collaborators */}
          {trip?.isCollaborator && (
            <FloatingActionButton 
              icon="add" 
              onPress={handleFABPress}
              style={{ bottom: spacing.xl + insets.bottom }}
            />
          )}
        </>
      ) : (
        <>
          {/* AppHeader for other tabs */}
          <AppHeader title={trip.title || "Trip"} showBell={false} rightElement={headerRightElement} />
          {active === "gallery" && <GalleryMasonry media={trip.media} onOpen={() => {}} />}
          {/* Only show settings tab if user is a collaborator */}
          {active === "settings" && trip?.isCollaborator && (
            <TripSettings 
              trip={trip} 
              onTripUpdate={(updatedTrip) => {
                // Refresh trip data when cover photo is updated
                const transformedTrip = {
                  ...trip,
                  coverPhotoUrl: updatedTrip.coverPhotoUrl,
                  coverUri: updatedTrip.coverPhotoUrl ? getMediaFileUrl(updatedTrip.coverPhotoUrl) : null,
                };
                setTrip(transformedTrip);
              }}
            />
          )}
          {/* If user tries to access settings but isn't a collaborator, redirect to timeline */}
          {active === "settings" && !trip?.isCollaborator && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <TText dim>You don't have permission to view settings for this trip.</TText>
            </View>
          )}
        </>
      )}

      {/* Trip Actions Bottom Sheet - Only show for collaborators */}
      {trip?.isCollaborator && (
        <BottomSheet visible={showActionsSheet} onClose={() => setShowActionsSheet(false)} maxHeight="50%">
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
              Trip Actions
            </TText>

            <Pressable
              onPress={() => handleAction("upload")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: spacing.lg,
                backgroundColor: colors.bg.layer2,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent.primary + "22",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="cloud-upload" size={24} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <TText weight="bold">Upload media</TText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </Pressable>

            <Pressable
              onPress={() => handleAction("arrange")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: spacing.lg,
                backgroundColor: colors.bg.layer2,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent.primary + "22",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="reorder-three" size={24} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <TText weight="bold">Edit moments</TText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </Pressable>

            <Pressable
              onPress={() => handleAction("sortAll")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: spacing.lg,
                backgroundColor: colors.bg.layer2,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent.primary + "22",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="swap-horizontal" size={24} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <TText weight="bold">Sort all media</TText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </Pressable>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

function RoundBtn({ icon, onPress, colors, isActive = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 38, height: 38, borderRadius: 999,
        alignItems:"center", justifyContent:"center",
        backgroundColor: isActive ? colors.accent.primary + "22" : colors.bg.layer1, 
        opacity: 0.92,
        borderWidth:1, 
        borderColor: isActive ? colors.accent.primary : colors.border,
      }}
      hitSlop={8}
    >
      <Ionicons 
        name={icon} 
        size={18} 
        color={isActive ? colors.accent.primary : colors.text.primary} 
      />
    </Pressable>
  );
}
