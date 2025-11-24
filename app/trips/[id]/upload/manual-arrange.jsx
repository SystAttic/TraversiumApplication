import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, Image, ActivityIndicator, Alert, FlatList, TextInput } from "react-native";
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

export default function ManualArrangeScreen() {
  const { id: tripId, uploadedFileIds: uploadedFileIdsJson } = useLocalSearchParams();
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
        
        // Filter media: if uploadedFileIds provided, only show newly uploaded media
        // Otherwise show all media (for direct navigation to this screen)
        const allMedia = defaultAlbumData?.media || [];
        console.log("All media in default album:", allMedia.length);
        console.log("Uploaded file IDs:", uploadedFileIds);
        
        let filteredMedia = uploadedFileIds && uploadedFileIds.length > 0
          ? allMedia.filter(media => {
              const matches = uploadedFileIds.includes(media.pathUrl);
              if (!matches && allMedia.length > 0) {
                console.log("Media pathUrl doesn't match:", media.pathUrl, "vs uploaded IDs:", uploadedFileIds);
              }
              return matches;
            })
          : allMedia;
        
        // Fallback: if filtering resulted in 0 items but we have uploadedFileIds,
        // show all media from default album (might be a timing issue or mismatch)
        if (filteredMedia.length === 0 && uploadedFileIds && uploadedFileIds.length > 0 && allMedia.length > 0) {
          console.warn("Filtering resulted in 0 items, falling back to showing all default album media");
          filteredMedia = allMedia;
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
  }, [tripIdNum, uploadedFileIds]);

  const currentMedia = unorganizedMedia[currentMediaIndex];
  const currentAssignment = currentMedia ? assignments[currentMedia.mediaId] : null;


  const handleSelectAlbum = (albumId) => {
    if (!currentMedia) return;
    setAssignments((prev) => ({
      ...prev,
      [currentMedia.mediaId]: albumId,
    }));
    // Auto-advance to next media after selection
    setTimeout(() => {
      if (currentMediaIndex < unorganizedMedia.length - 1) {
        setCurrentMediaIndex(currentMediaIndex + 1);
      }
    }, 300);
  };

  const handleMoveAlbum = (index, direction) => {
    if (direction === "up" && index > 0) {
      const newAlbums = [...albums];
      [newAlbums[index - 1], newAlbums[index]] = [newAlbums[index], newAlbums[index - 1]];
      setAlbums(newAlbums);
    } else if (direction === "down" && index < albums.length - 1) {
      const newAlbums = [...albums];
      [newAlbums[index], newAlbums[index + 1]] = [newAlbums[index + 1], newAlbums[index]];
      setAlbums(newAlbums);
    }
  };

  const handleSkip = () => {
    // Move to next media without assigning
    if (currentMediaIndex < unorganizedMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
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
        // Auto-select the newly created album
        if (currentMedia) {
          handleSelectAlbum(newAlbum.albumId);
        }
        // Move to next media after creating and assigning
        handleNext();
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

  const mediaUrl = getMediaFileUrl(currentMedia.pathUrl);
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
        <View
          style={{
            height: 300,
            backgroundColor: colors.bg.layer2,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1, position: "relative" }}>
            <Image
              source={{ uri: mediaUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />

            {/* Navigation Arrows */}
            {unorganizedMedia.length > 1 && (
              <>
                {currentMediaIndex > 0 && (
                  <Pressable
                    onPress={handlePrevious}
                    style={{
                      position: "absolute",
                      left: spacing.md,
                      top: "50%",
                      transform: [{ translateY: -20 }],
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.bg.layer1 + "E6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                  </Pressable>
                )}

                {currentMediaIndex < unorganizedMedia.length - 1 && (
                  <Pressable
                    onPress={handleNext}
                    style={{
                      position: "absolute",
                      right: spacing.md,
                      top: "50%",
                      transform: [{ translateY: -20 }],
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.bg.layer1 + "E6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
                  </Pressable>
                )}
              </>
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

            {/* Current Assignment Indicator */}
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
              </View>
            )}
          </View>
        </View>

        {/* Moments List Section */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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

          <FlatList
            data={albums}
            keyExtractor={(item) => String(item.albumId)}
            contentContainerStyle={{ 
              padding: spacing.xl, 
              paddingBottom: spacing.md,
              gap: spacing.xs 
            }}
            renderItem={({ item, index }) => {
              const isSelected = currentAssignment === item.albumId;
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
                  {/* Reorder buttons */}
                  <View style={{ flexDirection: "row", marginRight: spacing.sm }}>
                    <Pressable
                      onPress={() => handleMoveAlbum(index, "up")}
                      disabled={index === 0}
                      hitSlop={8}
                      style={{
                        opacity: index === 0 ? 0.3 : 1,
                        padding: spacing.xs,
                      }}
                    >
                      <Ionicons 
                        name="chevron-up" 
                        size={16} 
                        color={colors.text.muted} 
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveAlbum(index, "down")}
                      disabled={index === albums.length - 1}
                      hitSlop={8}
                      style={{
                        opacity: index === albums.length - 1 ? 0.3 : 1,
                        padding: spacing.xs,
                      }}
                    >
                      <Ionicons 
                        name="chevron-down" 
                        size={16} 
                        color={colors.text.muted} 
                      />
                    </Pressable>
                  </View>

                  {/* Moment title - single row */}
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

        {/* Skip Button - Fixed at bottom, outside FlatList */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.md,
            paddingTop: spacing.sm,
            backgroundColor: colors.bg.layer1,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleSkip}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.sm,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              alignItems: "center",
            }}
          >
            <TText dim size="sm">Skip for now</TText>
          </Pressable>
        </View>
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
