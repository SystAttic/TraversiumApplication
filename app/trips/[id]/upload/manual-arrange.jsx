import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert, FlatList, TextInput, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Screen from "../../../../src/components/Screen";
import AppHeader from "../../../../src/components/AppHeader";
import Card from "../../../../src/components/Card";
import TText from "../../../../src/components/TText";
import Button from "../../../../src/components/Button";
import { useTheme } from "../../../../src/theme";
import { spacing, radii } from "../../../../src/theme/spacing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getTripById, addAlbumToTrip } from "../../../../src/services/tripApi";
import { deleteMediaFromAlbum, addMediaToAlbum } from "../../../../src/services/momentApi";
import { getMediaFileUrl } from "../../../../src/services/fileStorageApi";
import BottomSheet from "../../../../src/components/BottomSheet";
import Input from "../../../../src/components/Input";
import { LinearGradient } from "expo-linear-gradient";
import AuthenticatedImage from "../../../../src/components/AuthenticatedImage";

export default function ManualArrangeScreen() {
  const { id: tripId, uploadedFileIds: uploadedFileIdsJson, sortAll } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Ensure tripId is a number
  const tripIdNum = useMemo(() => {
    const finalId = Array.isArray(tripId) ? tripId[0] : tripId;
    return Number(finalId);
  }, [tripId]);

  // Parse uploaded file IDs (pathUrls) to filter only newly uploaded media
  const uploadedFileIds = useMemo(() => {
    try {
      const json = Array.isArray(uploadedFileIdsJson) ? uploadedFileIdsJson[0] : uploadedFileIdsJson;
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [uploadedFileIdsJson]);

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [defaultAlbum, setDefaultAlbum] = useState(null);
  const [albums, setAlbums] = useState([]); // All albums except default (maintains order)
  const [unorganizedMedia, setUnorganizedMedia] = useState([]); // Media from default album
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [assignments, setAssignments] = useState({}); // { mediaId: albumId }
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [originalAlbumOrder, setOriginalAlbumOrder] = useState([]); // Track original order for comparison
  
  // Selection mode: 'single' or 'multiple'
  const [selectionMode, setSelectionMode] = useState('single');
  const [selectedMediaIds, setSelectedMediaIds] = useState(new Set()); // For batch selection

  // Load trip data
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const tripData = await getTripById(tripIdNum);
        if (!on) return;

        const defaultAlbumId = tripData.defaultAlbum;
        const allAlbums = tripData.albums || [];
        const defaultAlbumData = allAlbums.find((a) => a.albumId === defaultAlbumId);
        const otherAlbums = allAlbums.filter((a) => a.albumId !== defaultAlbumId);

        setTrip(tripData);
        setDefaultAlbum(defaultAlbumData);
        setAlbums(otherAlbums);
        setOriginalAlbumOrder(otherAlbums.map(a => a.albumId));
        
        // If sortAll is true, collect media from all albums (moments)
        // Otherwise, filter media from default album only
        let filteredMedia = [];
        
        if (sortAll === "true" || sortAll === true) {
          // Collect all media from all albums (including moments)
          const allMediaFromAllAlbums = [];
          allAlbums.forEach(album => {
            album.media?.forEach(m => {
              if (m.pathUrl) { // Skip media without pathUrl
                allMediaFromAllAlbums.push(m);
              }
            });
          });
          filteredMedia = allMediaFromAllAlbums;
        } else {
          // Original behavior: filter media from default album only
          const allMedia = defaultAlbumData?.media || [];
          console.log("All media in default album:", allMedia.length);
          console.log("Uploaded file IDs:", uploadedFileIds);
          
          filteredMedia = uploadedFileIds && uploadedFileIds.length > 0
            ? allMedia.filter(media => {
                if (!media.pathUrl) return false; // Skip media without pathUrl
                const matches = uploadedFileIds.includes(media.pathUrl);
                if (!matches && allMedia.length > 0) {
                  console.log("Media pathUrl doesn't match:", media.pathUrl, "vs uploaded IDs:", uploadedFileIds);
                }
                return matches;
              })
            : allMedia.filter(media => media.pathUrl); // Filter out media without pathUrl
          
          // Fallback: if filtering resulted in 0 items but we have uploadedFileIds,
          // show all media from default album (might be a timing issue or mismatch)
          if (filteredMedia.length === 0 && uploadedFileIds && uploadedFileIds.length > 0 && allMedia.length > 0) {
            console.warn("Filtering resulted in 0 items, falling back to showing all default album media");
            filteredMedia = allMedia;
          }
        }
        
        console.log("Filtered media count:", filteredMedia.length);
        setUnorganizedMedia(filteredMedia);
      } catch (error) {
        console.error("Failed to load trip:", error);
        Alert.alert("Error", "Failed to load trip data");
        router.back();
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [tripIdNum, uploadedFileIds, sortAll]);

  const currentMedia = unorganizedMedia[currentMediaIndex];
  const currentAssignment = currentMedia ? assignments[currentMedia.mediaId] : null;


  const handleSelectAlbum = (albumId) => {
    if (selectionMode === 'multiple') {
      // Batch mode: assign all selected media to this album
      if (selectedMediaIds.size === 0) return;
      
      const newAssignments = { ...assignments };
      selectedMediaIds.forEach(mediaId => {
        newAssignments[mediaId] = albumId;
      });
      setAssignments(newAssignments);
      
      // Clear selection
      setSelectedMediaIds(new Set());
    } else {
      // Single mode: assign current media (or unassign if already assigned to this album)
      if (!currentMedia) return;
      
      // If already assigned to this album, unassign it
      if (currentAssignment === albumId) {
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          delete newAssignments[currentMedia.mediaId];
          return newAssignments;
        });
      } else {
        // Assign to new album
        setAssignments((prev) => ({
          ...prev,
          [currentMedia.mediaId]: albumId,
        }));
      }
    }
  };

  // Unassign media in batch mode
  const handleUnassignMedia = (mediaId) => {
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[mediaId];
      return newAssignments;
    });
  };

  // Batch selection handlers
  const handleToggleMediaSelection = (mediaId) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    setSelectedMediaIds(new Set());
  };


  const handlePrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentMediaIndex < unorganizedMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      Alert.alert("Error", "Album title is required");
      return;
    }

    setCreatingAlbum(true);
    try {
      const newAlbumDto = {
        albumId: null,
        title: newAlbumTitle.trim(),
        description: newAlbumDescription.trim() || null,
        media: [],
      };

      const updatedTrip = await addAlbumToTrip(tripIdNum, newAlbumDto);
      const newAlbum = updatedTrip.albums.find((a) => a.title === newAlbumTitle.trim());

      if (newAlbum) {
        setAlbums((prev) => [...prev, newAlbum]);
        setNewAlbumTitle("");
        setNewAlbumDescription("");
        setShowCreateAlbum(false);
        // Auto-select the newly created album in single mode
        if (selectionMode === 'single' && currentMedia) {
          handleSelectAlbum(newAlbum.albumId);
        }
      }
    } catch (error) {
      console.error("Failed to create album:", error);
      Alert.alert("Error", "Failed to create album. Please try again.");
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleFinish = () => {
    const assignedCount = Object.keys(assignments).length;
    const totalCount = unorganizedMedia.length;

    const navigateToReview = () => {
      // Pass the current reordered albums to review screen
      const currentAlbumOrder = albums.map(a => a.albumId);
      router.push({
        pathname: `/trips/${tripIdNum}/upload/review`,
        params: {
          assignments: JSON.stringify(assignments),
          originalOrder: JSON.stringify(originalAlbumOrder),
          reorderedAlbums: JSON.stringify(albums), // Pass the reordered albums
        },
      });
    };

    if (assignedCount === 0) {
      Alert.alert(
        "No Assignments",
        "You haven't assigned any media to moments. Media in the default album won't be visible until organized. Continue anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: navigateToReview },
        ]
      );
    } else {
      navigateToReview();
    }
  };


  if (loading) {
    return (
      <Screen>
        <AppHeader title="Organize Media" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }


  // Check if we have no media to organize
  if (unorganizedMedia.length === 0) {
    // If we were filtering by uploadedFileIds but found nothing, there might be a mismatch
    if (uploadedFileIds && uploadedFileIds.length > 0) {
      return (
        <Screen>
          <AppHeader title="Organize Media" showBell={false} />
          <View style={{ flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" }}>
            <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md, textAlign: "center" }}>
              No Media Found
            </TText>
            <TText dim style={{ textAlign: "center", marginBottom: spacing.xl }}>
              The uploaded media could not be found in the default album. This might be a timing issue. Please try refreshing or go back and try again.
            </TText>
            <Pressable
              onPress={() => router.back()}
              style={{ borderRadius: 14, overflow: "hidden", minWidth: 150 }}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primary]}
                style={{ padding: 16, alignItems: "center" }}
              >
                <TText style={{ color: "#fff", fontWeight: "bold" }}>Go Back</TText>
              </LinearGradient>
            </Pressable>
          </View>
        </Screen>
      );
    }
    
    // If no uploadedFileIds filter, show "All Done" (user might have organized everything)
    return (
      <Screen>
        <AppHeader title="Organize Media" showBell={false} />
        <View style={{ flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" }}>
          <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md, textAlign: "center" }}>
            All Done! 🎉
          </TText>
          <TText dim style={{ textAlign: "center", marginBottom: spacing.xl }}>
            All media have been organized. You can now review and apply your changes.
          </TText>
          <Pressable
            onPress={handleFinish}
            style={{ borderRadius: 14, overflow: "hidden", minWidth: 150 }}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primary]}
              style={{ padding: 16, alignItems: "center" }}
            >
              <TText style={{ color: "#fff", fontWeight: "bold" }}>Review & Finish</TText>
            </LinearGradient>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!currentMedia) {
    return (
      <Screen>
        <AppHeader title="Organize Media" showBell={false} />
        <View style={{ flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" }}>
          <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.md, textAlign: "center" }}>
            All Done! 🎉
          </TText>
          <TText dim style={{ textAlign: "center", marginBottom: spacing.xl }}>
            All media have been organized. You can now review and apply your changes.
          </TText>
          <Pressable
            onPress={handleFinish}
            style={{ borderRadius: 14, overflow: "hidden", minWidth: 150 }}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primary]}
              style={{ padding: 16, alignItems: "center" }}
            >
              <TText style={{ color: "#fff", fontWeight: "bold" }}>Review & Finish</TText>
            </LinearGradient>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const mediaUrl = currentMedia.pathUrl ? getMediaFileUrl(currentMedia.pathUrl) : null;
  const assignedAlbum = currentAssignment ? albums.find((a) => a.albumId === currentAssignment) : null;

  return (
    <Screen>
      <AppHeader
        title="Organize Media"
        showBell={false}
        rightElement={
          <Pressable onPress={handleFinish} hitSlop={10}>
            <TText style={{ color: colors.accent.primary }}>Finish</TText>
          </Pressable>
        }
      />

      <View style={{ flex: 1 }}>
        {/* Media Preview Section */}
        {selectionMode === 'single' ? (
          <View
            style={{
              height: 300,
              backgroundColor: colors.bg.layer2,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1, position: "relative" }}>
              {mediaUrl ? (
                <AuthenticatedImage
                  source={{ uri: mediaUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg.layer3 }}>
                  <Ionicons name="image-outline" size={48} color={colors.text.muted} />
                  <TText dim style={{ marginTop: spacing.sm }}>No image available</TText>
                </View>
              )}

              {/* Media Counter */}
              <View
                style={{
                  position: "absolute",
                  top: spacing.md,
                  right: spacing.md,
                  backgroundColor: colors.bg.layer1 + "E6",
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.md,
                }}
              >
                <TText size="sm" weight="medium">
                  {currentMediaIndex + 1} / {unorganizedMedia.length}
                </TText>
              </View>

              {/* Current Assignment Indicator with Unassign Option */}
              {assignedAlbum && (
                <View
                  style={{
                    position: "absolute",
                    bottom: spacing.md,
                    left: spacing.md,
                    right: spacing.md,
                    backgroundColor: colors.status.success + "E6",
                    padding: spacing.sm,
                    borderRadius: radii.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <TText size="sm" style={{ color: "#fff", flex: 1 }} numberOfLines={1}>
                    Assigned to: {assignedAlbum.title}
                  </TText>
                  <Pressable
                    onPress={() => {
                      setAssignments((prev) => {
                        const newAssignments = { ...prev };
                        delete newAssignments[currentMedia.mediaId];
                        return newAssignments;
                      });
                    }}
                    style={{
                      padding: spacing.xs,
                      borderRadius: radii.sm,
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View
            style={{
              height: 300,
              backgroundColor: colors.bg.layer2,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <ScrollView
              contentContainerStyle={{
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              {/* Deselect All Button */}
              {selectedMediaIds.size > 0 && (
                <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs }}>
                  <Pressable
                    onPress={handleDeselectAll}
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      backgroundColor: colors.bg.layer3,
                      borderRadius: radii.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <TText size="sm">Deselect All ({selectedMediaIds.size})</TText>
                  </Pressable>
                </View>
              )}

              {/* Grid View - 4 images per row */}
              {(() => {
                const screenWidth = Dimensions.get('window').width;
                const itemWidth = (screenWidth - spacing.md * 2 - spacing.xs * 3) / 4;
                
                return (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                    {unorganizedMedia.map((media) => {
                      const mediaUrl = media.pathUrl ? getMediaFileUrl(media.pathUrl) : null;
                      const isSelected = selectedMediaIds.has(media.mediaId);
                      const isAssigned = assignments[media.mediaId];
                      const assignedAlbum = isAssigned ? albums.find(a => a.albumId === isAssigned) : null;
                      
                      return (
                        <Pressable
                          key={media.mediaId}
                          onPress={() => handleToggleMediaSelection(media.mediaId)}
                          style={{
                            width: itemWidth,
                            height: itemWidth,
                            borderRadius: radii.sm,
                            overflow: "hidden",
                            borderWidth: isSelected ? 3 : 1,
                            borderColor: isSelected ? colors.accent.primary : colors.border,
                            backgroundColor: colors.bg.layer3,
                            position: "relative",
                          }}
                        >
                          {mediaUrl ? (
                            <AuthenticatedImage
                              source={{ uri: mediaUrl }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                              <Ionicons name="image-outline" size={24} color={colors.text.muted} />
                            </View>
                          )}
                          
                          {/* Selection Checkmark - Top Right */}
                          {isSelected && (
                            <View
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.accent.primary,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            </View>
                          )}
                          
                          {/* Assignment Indicator - Bottom Right with unassign option */}
                          {isAssigned && assignedAlbum && (
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                handleUnassignMedia(media.mediaId);
                              }}
                              style={{
                                position: "absolute",
                                bottom: 4,
                                right: 4,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: colors.status.success,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            </Pressable>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        )}

        {/* Moments List Section */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: spacing.md,
            }}
          >
            {/* Selection Mode Toggle - Reduced Size */}
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => {
                  if (selectionMode !== 'single') {
                    if (selectedMediaIds.size === 1) {
                      const mediaId = Array.from(selectedMediaIds)[0];
                      const mediaIndex = unorganizedMedia.findIndex(m => m.mediaId === mediaId);
                      if (mediaIndex !== -1) {
                        setCurrentMediaIndex(mediaIndex);
                      }
                      setSelectedMediaIds(new Set());
                      setSelectionMode('single');
                    } else if (selectedMediaIds.size === 0) {
                      setSelectionMode('single');
                    } else {
                      Alert.alert(
                        "Cannot Switch Mode",
                        `Please select exactly 1 image (currently ${selectedMediaIds.size} selected) to switch to single image preview mode.`
                      );
                    }
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  backgroundColor: selectionMode === 'single' ? colors.accent.primary : colors.bg.layer2,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  borderColor: selectionMode === 'single' ? colors.accent.primary : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TText 
                  weight="medium" 
                  size="sm"
                  style={{ 
                    color: selectionMode === 'single' ? "#fff" : colors.text.primary,
                  }}
                >
                  Single Select
                </TText>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (selectionMode !== 'multiple') {
                    setSelectionMode('multiple');
                    setSelectedMediaIds(new Set());
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  backgroundColor: selectionMode === 'multiple' ? colors.accent.primary : colors.bg.layer2,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  borderColor: selectionMode === 'multiple' ? colors.accent.primary : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TText 
                  weight="medium" 
                  size="sm"
                  style={{ 
                    color: selectionMode === 'multiple' ? "#fff" : colors.text.primary,
                  }}
                >
                  Batch Select
                </TText>
              </Pressable>
            </View>

            {/* Header Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TText weight="bold">Select a Moment</TText>
              <Pressable
                onPress={() => setShowCreateAlbum(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  backgroundColor: colors.accent.primary + "22",
                  borderRadius: radii.sm,
                }}
              >
                <Ionicons name="add" size={18} color={colors.accent.primary} />
                <TText size="sm" style={{ color: colors.accent.primary }} weight="medium">
                  New Moment
                </TText>
              </Pressable>
            </View>
          </View>

          <FlatList
            data={albums}
            keyExtractor={(item) => String(item.albumId)}
            contentContainerStyle={{ 
              padding: spacing.xl, 
              paddingBottom: spacing.md,
              gap: spacing.xs 
            }}
            renderItem={({ item }) => {
              // In single mode, check if current media is assigned to this album
              // In multiple mode, don't highlight moments
              const isSelected = selectionMode === 'single' 
                ? currentAssignment === item.albumId
                : false;
              
              return (
                <Pressable
                  onPress={() => handleSelectAlbum(item.albumId)}
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected ? colors.accent.primary : colors.border,
                    borderRadius: radii.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: isSelected ? colors.accent.primary + "22" : colors.bg.layer2,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Moment title */}
                  <View style={{ flex: 1 }}>
                    <TText 
                      weight={isSelected ? "bold" : "normal"} 
                      style={{ color: isSelected ? colors.accent.primary : colors.text.primary }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </TText>
                  </View>

                  {/* Selection indicator */}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent.primary} style={{ marginLeft: spacing.sm }} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", padding: spacing.xl }}>
                <Ionicons name="albums-outline" size={48} color={colors.text.muted} />
                <TText dim style={{ marginTop: spacing.md, textAlign: "center" }}>
                  No moments yet. Create your first moment to organize your media!
                </TText>
              </View>
            }
          />
        </View>

        {/* Navigation Buttons - Fixed at bottom, only in single mode */}
        {selectionMode === 'single' && (
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing.md,
              paddingTop: spacing.sm,
              backgroundColor: colors.bg.layer1,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: "row",
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={handlePrevious}
              disabled={currentMediaIndex === 0}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                backgroundColor: currentMediaIndex === 0 ? colors.bg.layer3 : colors.bg.layer2,
                opacity: currentMediaIndex === 0 ? 0.5 : 1,
              }}
            >
              <TText size="sm" style={{ color: currentMediaIndex === 0 ? colors.text.muted : colors.text.primary }}>
                Previous
              </TText>
            </Pressable>
            <Pressable
              onPress={handleNext}
              disabled={currentMediaIndex >= unorganizedMedia.length - 1}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                backgroundColor: currentMediaIndex >= unorganizedMedia.length - 1 ? colors.bg.layer3 : colors.bg.layer2,
                opacity: currentMediaIndex >= unorganizedMedia.length - 1 ? 0.5 : 1,
              }}
            >
              <TText size="sm" style={{ color: currentMediaIndex >= unorganizedMedia.length - 1 ? colors.text.muted : colors.text.primary }}>
                Next
              </TText>
            </Pressable>
          </View>
        )}
      </View>

      {/* Create Album Bottom Sheet */}
      <BottomSheet visible={showCreateAlbum} onClose={() => setShowCreateAlbum(false)} maxHeight="60%">
        <View style={{ padding: spacing.xl }}>
          <TText weight="bold" style={{ fontSize: 20, marginBottom: spacing.lg }}>
            Create New Moment
          </TText>

          <View style={{ gap: spacing.md }}>
            <Input
              label="Moment Title"
              value={newAlbumTitle}
              onChangeText={setNewAlbumTitle}
              placeholder="Enter moment title"
              autoFocus
            />

            <Input
              label="Description (optional)"
              value={newAlbumDescription}
              onChangeText={setNewAlbumDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
              <Pressable
                onPress={() => setShowCreateAlbum(false)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  alignItems: "center",
                }}
              >
                <TText>Cancel</TText>
              </Pressable>

              <Pressable
                onPress={handleCreateAlbum}
                disabled={creatingAlbum || !newAlbumTitle.trim()}
                style={{
                  flex: 1,
                  borderRadius: radii.md,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={[
                    newAlbumTitle.trim() && !creatingAlbum ? colors.accent.primary : colors.bg.layer3,
                    newAlbumTitle.trim() && !creatingAlbum ? colors.accent.primary : colors.bg.layer3,
                  ]}
                  style={{ padding: spacing.md, alignItems: "center" }}
                >
                  {creatingAlbum ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <TText style={{ color: newAlbumTitle.trim() ? "#fff" : colors.text.muted }}>Create</TText>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
