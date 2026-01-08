import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Screen from "../../../../src/components/Screen";
import AppHeader from "../../../../src/components/AppHeader";
import Card from "../../../../src/components/Card";
import TText from "../../../../src/components/TText";
import { useTheme } from "../../../../src/theme";
import { spacing, radii } from "../../../../src/theme/spacing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getTripById, updateTrip } from "../../../../src/services/tripApi";
import { deleteMediaFromAlbum, addMediaToAlbum } from "../../../../src/services/momentApi";
import { getMediaFileUrl } from "../../../../src/services/fileStorageApi";
import { LinearGradient } from "expo-linear-gradient";
import AuthenticatedImage from "../../../../src/components/AuthenticatedImage";

export default function ReviewScreen() {
  const { 
    id: tripId, 
    assignments: assignmentsJson, 
    originalOrder: originalOrderJson, 
    reorderedAlbums: reorderedAlbumsJson,
    autosorted: autosortedParam,
    autosortedTrip: autosortedTripJson
  } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Parse route params
  const tripIdNum = useMemo(() => {
    const finalId = Array.isArray(tripId) ? tripId[0] : tripId;
    return Number(finalId);
  }, [tripId]);

  const isAutosorted = useMemo(() => {
    const param = Array.isArray(autosortedParam) ? autosortedParam[0] : autosortedParam;
    return param === "true";
  }, [autosortedParam]);

  const autosortedTrip = useMemo(() => {
    if (!isAutosorted) return null;
    try {
      const json = Array.isArray(autosortedTripJson) ? autosortedTripJson[0] : autosortedTripJson;
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [autosortedTripJson, isAutosorted]);

  const assignments = useMemo(() => {
    try {
      const json = Array.isArray(assignmentsJson) ? assignmentsJson[0] : assignmentsJson;
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  }, [assignmentsJson]);

  const originalAlbumOrder = useMemo(() => {
    try {
      const json = Array.isArray(originalOrderJson) ? originalOrderJson[0] : originalOrderJson;
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }, [originalOrderJson]);

  const reorderedAlbumsFromParams = useMemo(() => {
    try {
      const json = Array.isArray(reorderedAlbumsJson) ? reorderedAlbumsJson[0] : reorderedAlbumsJson;
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [reorderedAlbumsJson]);

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [defaultAlbum, setDefaultAlbum] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [unorganizedMedia, setUnorganizedMedia] = useState([]);
  const [applying, setApplying] = useState(false);

  // Load trip data
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        
        let tripData;
        if (isAutosorted && autosortedTrip) {
          // Use autosorted trip data directly
          tripData = autosortedTrip;
        } else {
          // Load from API
          tripData = await getTripById(tripIdNum);
        }
        
        if (!on) return;

        const defaultAlbumId = tripData.defaultAlbum;
        const allAlbums = tripData.albums || [];
        const defaultAlbumData = allAlbums.find((a) => a.albumId === defaultAlbumId);
        
        // Use reordered albums from params if available, otherwise use from API/autosorted data
        let otherAlbums;
        if (reorderedAlbumsFromParams && reorderedAlbumsFromParams.length > 0) {
          // Use the reordered albums passed from manual-arrange
          // We need to ensure they have all the data (media, etc.) from the API
          const albumMap = new Map(allAlbums.map(a => [a.albumId, a]));
          otherAlbums = reorderedAlbumsFromParams.map(reorderedAlbum => {
            // Merge with full album data from API to ensure we have all fields
            const fullAlbum = albumMap.get(reorderedAlbum.albumId);
            return fullAlbum || reorderedAlbum;
          });
        } else {
          // For autosorted, use the albums from autosorted trip (excluding default)
          // For manual, fallback to API order
          otherAlbums = allAlbums.filter((a) => a.albumId !== defaultAlbumId);
        }

        setTrip(tripData);
        setDefaultAlbum(defaultAlbumData);
        setAlbums(otherAlbums);
        setUnorganizedMedia(defaultAlbumData?.media || []);
      } catch (error) {
        console.error("Failed to load trip:", error);
        Alert.alert("Error", "Failed to load trip data");
        router.back();
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [tripIdNum, reorderedAlbumsFromParams, isAutosorted, autosortedTrip]);

  // Group assignments by album for review (for manual arrange)
  // For autosorted, we show all albums with their media directly
  const assignmentsByAlbum = useMemo(() => {
    if (isAutosorted) {
      // For autosorted, return albums with their media directly
      const grouped = {};
      albums.forEach(album => {
        if (album.media && album.media.length > 0) {
          grouped[album.albumId] = album.media;
        }
      });
      return grouped;
    }
    
    // For manual arrange, use assignments
    const grouped = {};
    Object.entries(assignments).forEach(([mediaId, albumId]) => {
      if (!grouped[albumId]) {
        grouped[albumId] = [];
      }
      const media = unorganizedMedia.find(m => m.mediaId === Number(mediaId));
      if (media) {
        grouped[albumId].push(media);
      }
    });
    return grouped;
  }, [assignments, unorganizedMedia, albums, isAutosorted]);

  const hasReordered = useMemo(() => {
    if (isAutosorted) {
      // For autosorted, we consider it reordered if albums exist
      return albums.length > 0;
    }
    return JSON.stringify(albums.map(a => a.albumId)) !== JSON.stringify(originalAlbumOrder);
  }, [albums, originalAlbumOrder, isAutosorted]);

  const handleApplyChanges = async () => {
    setApplying(true);
    const errors = [];

    try {
      // For autosorted trips, just update the trip with the autosorted data
      if (isAutosorted && autosortedTrip) {
        try {
          await updateTrip(autosortedTrip);
          Alert.alert("Success", "Your photos have been organized into moments!", [
            { text: "OK", onPress: () => router.replace(`/trips/${tripIdNum}`) },
          ]);
          return;
        } catch (error) {
          console.error("Failed to apply autosorted changes:", error);
          Alert.alert("Error", "Failed to apply changes. Please try again.");
          return;
        }
      }

      // Apply album reordering if changed (for manual arrange)
      if (hasReordered) {
        try {
          // Update trip with reordered albums (including default album)
          // Ensure we include all albums in the correct order: default album first, then reordered albums
          const reorderedAlbums = [defaultAlbum, ...albums].filter(Boolean);
          
          // Build the complete trip DTO with all required fields
          const updatedTripDto = {
            tripId: trip.tripId,
            title: trip.title,
            description: trip.description,
            ownerId: trip.ownerId,
            visibility: trip.visibility,
            coverPhotoUrl: trip.coverPhotoUrl,
            collaborators: trip.collaborators || [],
            viewers: trip.viewers || [],
            defaultAlbum: trip.defaultAlbum,
            albums: reorderedAlbums, // Pass albums in the new order
          };
          
          console.log("Updating trip with reordered albums:", reorderedAlbums.map(a => ({ id: a.albumId, title: a.title })));
          await updateTrip(updatedTripDto);
          console.log("Album order updated successfully");
        } catch (error) {
          console.error("Failed to update album order:", error);
          Alert.alert("Warning", "Failed to update moment order. Media assignments will still be applied.");
          // Continue with media assignments even if reordering fails
        }
      }

      // Apply each assignment
      for (const [mediaId, albumId] of Object.entries(assignments)) {
        const media = unorganizedMedia.find((m) => m.mediaId === Number(mediaId));
        if (!media) continue;

        try {
          // Delete from default album
          await deleteMediaFromAlbum(defaultAlbum.albumId, media.mediaId);

          // Add to target album
          await addMediaToAlbum(albumId, {
            pathUrl: media.pathUrl,
            uploader: media.uploader,
            fileType: media.fileType,
            fileFormat: media.fileFormat,
            fileSize: media.fileSize,
            geoLocation: media.geoLocation,
          });
        } catch (error) {
          console.error(`Failed to move media ${mediaId}:`, error);
          errors.push(mediaId);
        }
      }

      if (errors.length > 0) {
        Alert.alert(
          "Partial Success",
          `${Object.keys(assignments).length - errors.length} media moved successfully. ${errors.length} failed.`
        );
      } else {
        Alert.alert("Success", "All media have been organized into moments!", [
          { text: "OK", onPress: () => router.replace(`/trips/${tripIdNum}`) },
        ]);
      }
    } catch (error) {
      console.error("Failed to apply changes:", error);
      Alert.alert("Error", "Failed to apply changes. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Review Changes" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  const assignedCount = isAutosorted 
    ? albums.reduce((sum, album) => sum + (album.media?.length || 0), 0)
    : Object.keys(assignments).length;
  const skippedCount = isAutosorted ? 0 : unorganizedMedia.length - assignedCount;

  return (
    <Screen>
      <AppHeader title="Review Changes" showBell={false} />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          padding: spacing.xl,
          paddingBottom: spacing.xl + insets.bottom
        }}
      >
        <Card>
          <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md }}>
            {isAutosorted ? "Review Auto-Organized Moments:" : "Here is review of your changes:"}
          </TText>
          
          {isAutosorted && (
            <View
              style={{
                padding: spacing.sm,
                backgroundColor: colors.status.info + "22",
                borderRadius: radii.sm,
                marginBottom: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Ionicons name="sparkles" size={16} color={colors.status.info} />
              <TText size="sm" style={{ color: colors.status.info }}>
                Photos have been automatically organized into moments
              </TText>
            </View>
          )}

          {/* Reordering indicator */}
          {hasReordered && (
            <View
              style={{
                padding: spacing.sm,
                backgroundColor: colors.accent.primary + "22",
                borderRadius: radii.sm,
                marginBottom: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.accent.primary} />
              <TText size="sm" style={{ color: colors.accent.primary }}>
                Moments have been reordered
              </TText>
            </View>
          )}

          {/* Assignments review */}
          {Object.keys(assignmentsByAlbum).length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <TText weight="medium" style={{ marginBottom: spacing.md }}>
                Media Assignments:
              </TText>
              <View style={{ gap: spacing.md }}>
                {albums.map((album) => {
                  const mediaInAlbum = assignmentsByAlbum[album.albumId] || [];
                  if (mediaInAlbum.length === 0) return null;

                  return (
                    <View key={album.albumId} style={{ gap: spacing.xs }}>
                      <TText weight="medium" style={{ marginBottom: spacing.xs }}>
                        → {album.title}
                      </TText>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: spacing.xs }}
                      >
                        {mediaInAlbum.map((media) => {
                          if (!media.pathUrl) return null; // Skip media without pathUrl
                          const mediaUrl = getMediaFileUrl(media.pathUrl);
                          return (
                            <AuthenticatedImage
                              key={media.mediaId}
                              source={{ uri: mediaUrl }}
                              style={{
                                width: 60,
                                height: 60,
                                borderRadius: radii.sm,
                                backgroundColor: colors.bg.layer3,
                              }}
                              resizeMode="cover"
                            />
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Summary */}
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TText>Media assigned to moments:</TText>
              <TText weight="bold" style={{ color: colors.status.success }}>
                {assignedCount}
              </TText>
            </View>

            {skippedCount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <TText dim>Media left in default album:</TText>
                <TText weight="bold" dim>
                  {skippedCount}
                </TText>
              </View>
            )}

            {skippedCount > 0 && (
              <View
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.status.warning + "22",
                  borderRadius: radii.md,
                  marginTop: spacing.sm,
                }}
              >
                <TText size="sm" style={{ color: colors.status.warning }}>
                  ⚠️ Media in the default album won't be visible until organized into moments.
                </TText>
              </View>
            )}
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <Pressable
              onPress={handleApplyChanges}
              disabled={applying}
              style={{ borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primary]}
                style={{ padding: 16, alignItems: "center" }}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <TText style={{ color: "#fff", fontWeight: "bold" }}>Apply Changes</TText>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={applying}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                padding: spacing.md,
                alignItems: "center",
              }}
            >
              <TText>Go Back</TText>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

