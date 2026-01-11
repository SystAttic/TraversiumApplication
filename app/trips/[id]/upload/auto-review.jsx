import React, { useState, useMemo } from "react";
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
import { updateTrip } from "../../../../src/services/tripApi";
import { getMediaFileUrl } from "../../../../src/services/fileStorageApi";
import { LinearGradient } from "expo-linear-gradient";
import AuthenticatedImage from "../../../../src/components/AuthenticatedImage";

export default function AutoReviewScreen() {
  const { 
    id: tripId, 
    originalTrip: originalTripJson,
    autosortedTrip: autosortedTripJson
  } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tripIdNum = useMemo(() => {
    const finalId = Array.isArray(tripId) ? tripId[0] : tripId;
    return Number(finalId);
  }, [tripId]);

  const originalTrip = useMemo(() => {
    try {
      const json = Array.isArray(originalTripJson) ? originalTripJson[0] : originalTripJson;
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [originalTripJson]);

  const autosortedTrip = useMemo(() => {
    try {
      const json = Array.isArray(autosortedTripJson) ? autosortedTripJson[0] : autosortedTripJson;
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [autosortedTripJson]);

  const [applying, setApplying] = useState(false);

  // Calculate changes
  const changes = useMemo(() => {
    if (!originalTrip || !autosortedTrip) return null;

    const originalDefaultAlbum = originalTrip.albums?.find(a => a.albumId === originalTrip.defaultAlbum);
    const sortedDefaultAlbum = autosortedTrip.albums?.find(a => a.albumId === autosortedTrip.defaultAlbum);
    
    const originalUnorganizedCount = originalDefaultAlbum?.media?.length || 0;
    const sortedUnorganizedCount = sortedDefaultAlbum?.media?.length || 0;
    const organizedCount = originalUnorganizedCount - sortedUnorganizedCount;

    // Get original albums (excluding default)
    const originalAlbums = originalTrip.albums?.filter(a => a.albumId !== originalTrip.defaultAlbum) || [];
    const sortedAlbums = autosortedTrip.albums?.filter(a => a.albumId !== autosortedTrip.defaultAlbum) || [];

    // Find new albums (albums that don't exist in original)
    const originalAlbumIds = new Set(originalAlbums.map(a => a.albumId));
    const newAlbums = sortedAlbums.filter(a => !originalAlbumIds.has(a.albumId));

    // Find albums with new media
    const albumsWithChanges = sortedAlbums.map(sortedAlbum => {
      const originalAlbum = originalAlbums.find(a => a.albumId === sortedAlbum.albumId);
      if (!originalAlbum) {
        // New album
        return {
          album: sortedAlbum,
          isNew: true,
          addedMedia: sortedAlbum.media || [],
          removedMedia: [],
        };
      }

      // Existing album - find added media
      const originalMediaIds = new Set((originalAlbum.media || []).map(m => m.mediaId));
      const sortedMediaIds = new Set((sortedAlbum.media || []).map(m => m.mediaId));
      
      const addedMedia = (sortedAlbum.media || []).filter(m => !originalMediaIds.has(m.mediaId));
      const removedMedia = (originalAlbum.media || []).filter(m => !sortedMediaIds.has(m.mediaId));

      if (addedMedia.length === 0 && removedMedia.length === 0) {
        return null; // No changes
      }

      return {
        album: sortedAlbum,
        isNew: false,
        addedMedia,
        removedMedia,
      };
    }).filter(Boolean);

    return {
      organizedCount,
      originalUnorganizedCount,
      sortedUnorganizedCount,
      newAlbums,
      albumsWithChanges,
      totalNewAlbums: newAlbums.length,
    };
  }, [originalTrip, autosortedTrip]);

  const handleApplyChanges = async () => {
    if (!autosortedTrip) {
      Alert.alert("Error", "No changes to apply");
      return;
    }

    setApplying(true);

    try {
      // Update the trip with the autosorted data
      await updateTrip(autosortedTrip);
      
      Alert.alert(
        "Success", 
        "Your photos have been organized into moments!",
        [
          { 
            text: "OK", 
            onPress: () => router.replace(`/trips/${tripIdNum}`) 
          },
        ]
      );
    } catch (error) {
      console.error("Failed to apply autosorted changes:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to apply changes. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

  if (!originalTrip || !autosortedTrip || !changes) {
    return (
      <Screen>
        <AppHeader title="Review Auto-Sort" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Review Auto-Sort" showBell={false} />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          padding: spacing.xl,
          paddingBottom: spacing.xl + insets.bottom
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ padding: spacing.xl }}>
          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            <TText weight="bold" style={{ fontSize: 20 }}>
              Review Auto-Organized Moments
            </TText>
            <TText dim>
              Here's what changed after auto-sorting your photos:
            </TText>
          </View>

          {/* Summary Card */}
          <View
            style={{
              padding: spacing.md,
              backgroundColor: colors.status.info + "22",
              borderRadius: radii.md,
              marginBottom: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Ionicons name="sparkles" size={20} color={colors.status.info} />
              <TText weight="semibold" style={{ color: colors.status.info }}>
                Summary
              </TText>
            </View>
            
            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TText>Photos organized:</TText>
                <TText weight="bold" style={{ color: colors.status.success }}>
                  {changes.organizedCount}
                </TText>
              </View>
              
              {changes.totalNewAlbums > 0 && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TText>New moments created:</TText>
                  <TText weight="bold" style={{ color: colors.status.success }}>
                    {changes.totalNewAlbums}
                  </TText>
                </View>
              )}
              
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TText>Remaining unorganized:</TText>
                <TText weight="bold" dim>
                  {changes.sortedUnorganizedCount}
                </TText>
              </View>
            </View>
          </View>

          {/* New Albums */}
          {changes.newAlbums.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <TText weight="semibold" style={{ fontSize: 16, marginBottom: spacing.md }}>
                New Moments Created:
              </TText>
              <View style={{ gap: spacing.md }}>
                {changes.newAlbums.map((album) => (
                  <View 
                    key={album.albumId || `new-${album.title}`}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <Ionicons name="add-circle" size={16} color={colors.status.success} />
                      <TText weight="medium">{album.title || "Untitled Moment"}</TText>
                      <TText dim size="sm">
                        ({album.media?.length || 0} photo{album.media?.length !== 1 ? "s" : ""})
                      </TText>
                    </View>
                    
                    {album.media && album.media.length > 0 && (
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: spacing.xs, marginTop: spacing.xs }}
                      >
                        {album.media.slice(0, 10).map((media) => {
                          if (!media.pathUrl) return null;
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
                        {album.media.length > 10 && (
                          <View
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: radii.sm,
                              backgroundColor: colors.bg.layer3,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <TText dim size="sm">
                              +{album.media.length - 10}
                            </TText>
                          </View>
                        )}
                      </ScrollView>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Albums with Changes */}
          {changes.albumsWithChanges.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <TText weight="semibold" style={{ fontSize: 16, marginBottom: spacing.md }}>
                Updated Moments:
              </TText>
              <View style={{ gap: spacing.md }}>
                {changes.albumsWithChanges.map((change) => (
                  <View 
                    key={change.album.albumId}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      gap: spacing.sm,
                    }}
                  >
                    <TText weight="medium">{change.album.title || "Untitled Moment"}</TText>
                    
                    {change.addedMedia.length > 0 && (
                      <View style={{ gap: spacing.xs }}>
                        <TText size="sm" style={{ color: colors.status.success }}>
                          +{change.addedMedia.length} photo{change.addedMedia.length !== 1 ? "s" : ""} added
                        </TText>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: spacing.xs }}
                        >
                          {change.addedMedia.slice(0, 5).map((media) => {
                            if (!media.pathUrl) return null;
                            const mediaUrl = getMediaFileUrl(media.pathUrl);
                            return (
                              <AuthenticatedImage
                                key={media.mediaId}
                                source={{ uri: mediaUrl }}
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: radii.sm,
                                  backgroundColor: colors.bg.layer3,
                                }}
                                resizeMode="cover"
                              />
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Warning if there are still unorganized photos */}
          {changes.sortedUnorganizedCount > 0 && (
            <View
              style={{
                padding: spacing.md,
                backgroundColor: colors.status.warning + "22",
                borderRadius: radii.md,
                marginBottom: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Ionicons name="warning" size={16} color={colors.status.warning} />
              <TText size="sm" style={{ color: colors.status.warning, flex: 1 }}>
                {changes.sortedUnorganizedCount} photo{changes.sortedUnorganizedCount !== 1 ? "s" : ""} remain unorganized. 
                They will stay in the default album and won't be visible until organized into moments.
              </TText>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Pressable
              onPress={handleApplyChanges}
              disabled={applying}
              style={{ borderRadius: radii.md, overflow: "hidden" }}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primary]}
                style={{ padding: spacing.md, alignItems: "center" }}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <TText style={{ color: "#fff", fontWeight: "bold" }}>
                    Apply Changes
                  </TText>
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
              <TText>Cancel</TText>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
