import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Screen from "../../../src/components/Screen";
import AppHeader from "../../../src/components/AppHeader";
import Card from "../../../src/components/Card";
import TText from "../../../src/components/TText";
import { useTheme } from "../../../src/theme";
import { spacing, radii } from "../../../src/theme/spacing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getTripById, updateTrip, addAlbumToTrip, deleteAlbumFromTrip } from "../../../src/services/tripApi";
import { updateAlbum, addMediaToAlbum, deleteMediaFromAlbum } from "../../../src/services/momentApi";
import { getMediaFileUrl } from "../../../src/services/fileStorageApi";
import { LinearGradient } from "expo-linear-gradient";
import AuthenticatedImage from "../../../src/components/AuthenticatedImage";
import BottomSheet from "../../../src/components/BottomSheet";
import ModalConfirm from "../../../src/components/ModalConfirm";

export default function EditMomentsScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tripIdNum = useMemo(() => {
    const finalId = Array.isArray(tripId) ? tripId[0] : tripId;
    return Number(finalId);
  }, [tripId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trip, setTrip] = useState(null);
  const [moments, setMoments] = useState([]);
  const [originalMoments, setOriginalMoments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Edit moment bottom sheet
  const [editingMoment, setEditingMoment] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showEditSheet, setShowEditSheet] = useState(false);
  
  // Create moment bottom sheet
  const [isCreating, setIsCreating] = useState(false);
  const [newMomentTitle, setNewMomentTitle] = useState("");
  const [newMomentDescription, setNewMomentDescription] = useState("");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  
  // Cancel confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Delete moment confirmation
  const [deletingMoment, setDeletingMoment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load trip data
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const tripData = await getTripById(tripIdNum);
        if (!on) return;

        // Extract moments (albums excluding default)
        const defaultAlbumId = tripData.defaultAlbum;
        const allAlbums = tripData.albums || [];
        const momentAlbums = allAlbums.filter(a => a.albumId !== defaultAlbumId);
        
        // Transform to moment format
        const momentsData = momentAlbums.map((album) => {
          const albumMedia = album.media || [];
          const coverMedia = albumMedia[0];
          return {
            albumId: album.albumId,
            title: album.title || "Untitled Moment",
            description: album.description || "",
            coverUri: coverMedia ? getMediaFileUrl(coverMedia.pathUrl) : null,
            mediaCount: albumMedia.length,
            originalTitle: album.title || "Untitled Moment",
            originalDescription: album.description || "",
          };
        });

        setTrip(tripData);
        setMoments(momentsData);
        setOriginalMoments(JSON.parse(JSON.stringify(momentsData))); // Deep clone
      } catch (error) {
        console.error("Failed to load trip:", error);
        Alert.alert("Error", "Failed to load trip data");
        router.back();
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [tripIdNum]);

  // Check for changes
  useEffect(() => {
    // Note: Order changes are not saved (backend limitation), so we don't count them as changes
    const hasContentChanged = moments.some(m => {
      const original = originalMoments.find(o => o.albumId === m.albumId);
      return !original || 
             m.title !== original.originalTitle || 
             m.description !== original.originalDescription;
    });
    // New moments (without albumId or with isNew flag) count as changes
    const hasNewMoments = moments.some(m => m.isNew || !m.albumId);
    setHasChanges(hasContentChanged || hasNewMoments);
  }, [moments, originalMoments]);

  // Reorder functions
  const moveMomentUp = (index) => {
    if (index === 0) return;
    const newMoments = [...moments];
    [newMoments[index - 1], newMoments[index]] = [newMoments[index], newMoments[index - 1]];
    setMoments(newMoments);
  };

  const moveMomentDown = (index) => {
    if (index === moments.length - 1) return;
    const newMoments = [...moments];
    [newMoments[index], newMoments[index + 1]] = [newMoments[index + 1], newMoments[index]];
    setMoments(newMoments);
  };

  // Edit moment functions
  const handleEditMoment = (moment) => {
    setEditingMoment(moment);
    setEditTitle(moment.title);
    setEditDescription(moment.description);
    setShowEditSheet(true);
  };

  const handleSaveEdit = () => {
    if (!editingMoment) return;
    
    const newMoments = moments.map(m => 
      m.albumId === editingMoment.albumId
        ? { ...m, title: editTitle.trim() || "Untitled Moment", description: editDescription.trim() }
        : m
    );
    setMoments(newMoments);
    setShowEditSheet(false);
    setEditingMoment(null);
  };

  const handleCancelEdit = () => {
    setShowEditSheet(false);
    setEditingMoment(null);
    setEditTitle("");
    setEditDescription("");
  };

  // Create moment functions
  const handleCreateMoment = () => {
    setNewMomentTitle("");
    setNewMomentDescription("");
    setShowCreateSheet(true);
  };

  const handleSaveNewMoment = async () => {
    if (!newMomentTitle.trim()) {
      Alert.alert("Error", "Please enter a moment title");
      return;
    }

    setIsCreating(true);

    try {
      // Create the new album via API
      const newAlbum = await addAlbumToTrip(tripIdNum, {
        title: newMomentTitle.trim(),
        description: newMomentDescription.trim() || null,
        media: [],
      });

      // Add the new moment to the list
      // Use user's input directly since API might return trip title as default
      const momentTitle = newMomentTitle.trim();
      const momentDescription = newMomentDescription.trim() || "";
      
      const newMoment = {
        albumId: newAlbum.albumId,
        title: momentTitle,
        description: momentDescription,
        coverUri: null,
        mediaCount: 0,
        originalTitle: momentTitle,
        originalDescription: momentDescription,
        isNew: true, // Mark as new for change tracking
      };

      setMoments([...moments, newMoment]);
      setShowCreateSheet(false);
      setNewMomentTitle("");
      setNewMomentDescription("");

      // Refresh trip data to get updated album list
      const tripData = await getTripById(tripIdNum);
      setTrip(tripData);
    } catch (error) {
      console.error("Failed to create moment:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create moment. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateSheet(false);
    setNewMomentTitle("");
    setNewMomentDescription("");
  };

  // Save all changes
  const handleSave = async () => {
    if (!trip || !hasChanges) return;

    setSaving(true);

    try {
      // Update individual moments that were edited (only existing moments, not new ones)
      const updatePromises = [];
      for (const moment of moments) {
        const original = originalMoments.find(o => o.albumId === moment.albumId);
        // Skip new moments (they were already created via addAlbumToTrip)
        if (!original || moment.isNew) continue;

        const titleChanged = moment.title !== original.originalTitle;
        const descriptionChanged = moment.description !== original.originalDescription;

        if (titleChanged || descriptionChanged) {
          updatePromises.push(
            updateAlbum(moment.albumId, {
              albumId: moment.albumId,
              title: moment.title,
              description: moment.description,
              media: [], // Media is managed separately
            })
          );
        }
      }

      // Wait for all moment updates
      await Promise.all(updatePromises);

      // Refresh trip data to get latest album data (including newly created ones and any updates)
      const latestTripData = await getTripById(tripIdNum);

      // Build reordered albums array using the order from moments state
      // This preserves the user's reordering
      const defaultAlbum = latestTripData.albums?.find(a => a.albumId === latestTripData.defaultAlbum);
      const reorderedAlbums = [
        defaultAlbum,
        ...moments.map(m => {
          // Find the album in the latest trip data to preserve all its data (including media)
          const album = latestTripData.albums?.find(a => a.albumId === m.albumId);
          if (!album) {
            // This shouldn't happen, but handle gracefully
            return {
              albumId: m.albumId,
              title: m.title,
              description: m.description,
              media: [],
            };
          }
          // Preserve all album data, only update title/description if changed
          return {
            ...album,
            title: m.title,
            description: m.description,
          };
        }),
      ].filter(Boolean);

      // Build the complete trip DTO with all required fields
      // Explicitly set all fields to ensure the backend processes the update correctly
      const updatedTrip = {
        tripId: latestTripData.tripId,
        title: latestTripData.title || "",
        description: latestTripData.description || null,
        ownerId: latestTripData.ownerId,
        visibility: latestTripData.visibility || "PRIVATE",
        coverPhotoUrl: latestTripData.coverPhotoUrl || null,
        collaborators: latestTripData.collaborators || [],
        viewers: latestTripData.viewers || [],
        defaultAlbum: latestTripData.defaultAlbum || null,
        albums: reorderedAlbums, // Pass albums in the new order - this is the key!
      };

      console.log("Updating trip with reordered albums:", reorderedAlbums.map(a => ({ id: a.albumId, title: a.title })));
      await updateTrip(updatedTrip);
      console.log("Album order updated successfully");

      Alert.alert(
        "Success",
        "Moments have been updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace(`/trips/${tripIdNum}`),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save changes:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel with confirmation
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    router.back();
  };

  // Delete moment functions
  const handleDeleteMoment = (moment) => {
    // Can't delete new moments that haven't been saved yet
    if (!moment.albumId || moment.isNew) {
      Alert.alert("Error", "Cannot delete a moment that hasn't been saved yet. Please save changes first.");
      return;
    }
    setDeletingMoment(moment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMoment || !trip || !deletingMoment.albumId) {
      setShowDeleteModal(false);
      setDeletingMoment(null);
      return;
    }

    setDeleting(true);

    try {
      // Get the full album data to access media
      const latestTripData = await getTripById(tripIdNum);
      const album = latestTripData.albums?.find(a => a.albumId === deletingMoment.albumId);
      
      if (!album) {
        Alert.alert("Error", "Album not found");
        setShowDeleteModal(false);
        setDeletingMoment(null);
        return;
      }

      const defaultAlbumId = latestTripData.defaultAlbum;
      const albumMedia = album.media || [];

      // Move all media from the moment to the default album
      if (albumMedia.length > 0 && defaultAlbumId) {
        // Prepare media DTOs for moving to default album
        const mediaDtos = albumMedia.map(media => ({
          pathUrl: media.pathUrl,
          uploader: media.uploader,
          fileType: media.fileType,
          fileFormat: media.fileFormat,
          fileSize: media.fileSize,
          geoLocation: media.geoLocation,
          createdAt: media.createdAt,
        }));

        // Add all media to default album
        await addMediaToAlbum(defaultAlbumId, mediaDtos);

        // Remove media from the moment album
        for (const media of albumMedia) {
          try {
            await deleteMediaFromAlbum(deletingMoment.albumId, media.mediaId);
          } catch (error) {
            console.error(`Failed to remove media ${media.mediaId} from album:`, error);
            // Continue with other media even if one fails
          }
        }
      }

      // Delete the album
      await deleteAlbumFromTrip(tripIdNum, deletingMoment.albumId);

      // Remove from local state
      setMoments(moments.filter(m => m.albumId !== deletingMoment.albumId));
      
      // Update original moments too
      setOriginalMoments(originalMoments.filter(m => m.albumId !== deletingMoment.albumId));
      
      // Refresh trip data
      const refreshedTripData = await getTripById(tripIdNum);
      setTrip(refreshedTripData);

      setShowDeleteModal(false);
      setDeletingMoment(null);

      Alert.alert(
        "Success",
        albumMedia.length > 0
          ? `Moment deleted. ${albumMedia.length} photo${albumMedia.length !== 1 ? "s" : ""} moved to default album.`
          : "Moment deleted successfully."
      );
    } catch (error) {
      console.error("Failed to delete moment:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to delete moment. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingMoment(null);
  };

  // Create button for header
  const headerRightElement = (
    <Pressable
      onPress={handleCreateMoment}
      hitSlop={8}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent.primary + "22",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.accent.primary + "44",
      }}
    >
      <Ionicons name="add-circle" size={22} color={colors.accent.primary} />
    </Pressable>
  );

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Edit Moments" showBell={false} rightElement={headerRightElement} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <AppHeader title="Edit Moments" showBell={false} rightElement={headerRightElement} />
        
        {saving && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <View
              style={{
                backgroundColor: colors.bg.layer1,
                borderRadius: radii.lg,
                padding: spacing.xl,
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <TText weight="semibold">Saving changes...</TText>
            </View>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing.xl + insets.bottom + 200, // Extra space for fixed buttons
          }}
          showsVerticalScrollIndicator={false}
        >
        {/* Warning about reordering */}
        {moments.length > 1 && (
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
            <Ionicons name="warning" size={20} color={colors.status.warning} />
            <TText size="sm" style={{ color: colors.status.warning, flex: 1 }}>
              Reordering not implemented in backend. Moment order changes will not be saved.
            </TText>
          </View>
        )}

        {moments.length === 0 ? (
          <Card style={{ padding: spacing.xl, alignItems: "center" }}>
            <Ionicons name="albums-outline" size={48} color={colors.text.muted} />
            <TText dim style={{ marginTop: spacing.md }}>
              No moments to edit
            </TText>
            <TText dim size="sm" style={{ marginTop: spacing.xs, textAlign: "center" }}>
              Tap the + button in the header to create a new moment
            </TText>
          </Card>
        ) : (
          <View style={{ gap: spacing.md }}>
            {moments.map((moment, index) => (
              <Card key={moment.albumId ? `moment-${moment.albumId}` : `new-moment-${index}-${moment.title}`} style={{ padding: spacing.md }}>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  {/* Reorder buttons */}
                  <View style={{ justifyContent: "center", gap: spacing.xs }}>
                    <Pressable
                      onPress={() => moveMomentUp(index)}
                      disabled={index === 0}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radii.sm,
                        backgroundColor: index === 0 ? colors.bg.layer3 : colors.accent.primary + "22",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: index === 0 ? 0.5 : 1,
                      }}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={index === 0 ? colors.text.muted : colors.accent.primary}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveMomentDown(index)}
                      disabled={index === moments.length - 1}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radii.sm,
                        backgroundColor: index === moments.length - 1 ? colors.bg.layer3 : colors.accent.primary + "22",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: index === moments.length - 1 ? 0.5 : 1,
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={index === moments.length - 1 ? colors.text.muted : colors.accent.primary}
                      />
                    </Pressable>
                  </View>

                  {/* Moment preview */}
                  <Pressable
                    onPress={() => handleEditMoment(moment)}
                    style={{ flex: 1, flexDirection: "row", gap: spacing.md }}
                  >
                    {moment.coverUri ? (
                      <AuthenticatedImage
                        source={{ uri: moment.coverUri }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: radii.md,
                          backgroundColor: colors.bg.layer3,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: radii.md,
                          backgroundColor: colors.bg.layer3,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="images-outline" size={32} color={colors.text.muted} />
                      </View>
                    )}
                    <View style={{ flex: 1, justifyContent: "center", gap: spacing.xs }}>
                      <TText weight="semibold" numberOfLines={1}>
                        {moment.title}
                      </TText>
                      {moment.description ? (
                        <TText dim size="sm" numberOfLines={2}>
                          {moment.description}
                        </TText>
                      ) : null}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
                        <Ionicons name="images-outline" size={14} color={colors.text.muted} />
                        <TText dim size="sm">
                          {moment.mediaCount} photo{moment.mediaCount !== 1 ? "s" : ""}
                        </TText>
                      </View>
                    </View>
                  </Pressable>

                  {/* Action buttons */}
                  <View style={{ justifyContent: "center", gap: spacing.xs }}>
                    <Pressable
                      onPress={() => handleEditMoment(moment)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.accent.primary + "22",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.accent.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteMoment(moment)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.status.danger + "22",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.status.danger} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {hasChanges && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.status.info + "22",
              borderRadius: radii.md,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <Ionicons name="information-circle" size={16} color={colors.status.info} />
            <TText size="sm" style={{ color: colors.status.info, flex: 1 }}>
              You have unsaved changes
            </TText>
          </View>
        )}
        </ScrollView>

        {/* Action buttons - Fixed at bottom */}
        <View
          style={{
            padding: spacing.xl,
            paddingBottom: spacing.xl + insets.bottom,
            backgroundColor: colors.bg.layer1,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: spacing.md,
          }}
        >
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={{ borderRadius: radii.md, overflow: "hidden", opacity: !hasChanges || saving ? 0.5 : 1 }}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primary]}
            style={{ padding: spacing.md, alignItems: "center" }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <TText style={{ color: "#fff", fontWeight: "bold" }}>
                Save Changes
              </TText>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleCancel}
          disabled={saving}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: spacing.md,
            alignItems: "center",
            opacity: saving ? 0.5 : 1,
          }}
        >
          <TText>Cancel</TText>
        </Pressable>
        </View>
      </View>

      {/* Create Moment Bottom Sheet */}
      <BottomSheet visible={showCreateSheet} onClose={handleCancelCreate} maxHeight="60%">
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
            Create New Moment
          </TText>

          <View style={{ gap: spacing.md }}>
            <View>
              <TText weight="medium" style={{ marginBottom: spacing.xs }}>
                Title <TText style={{ color: colors.status.danger }}>*</TText>
              </TText>
              <TextInput
                value={newMomentTitle}
                onChangeText={setNewMomentTitle}
                placeholder="Enter moment title"
                placeholderTextColor={colors.text.muted}
                style={{
                  backgroundColor: colors.bg.layer2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontSize: 16,
                }}
              />
            </View>

            <View>
              <TText weight="medium" style={{ marginBottom: spacing.xs }}>
                Description
              </TText>
              <TextInput
                value={newMomentDescription}
                onChangeText={setNewMomentDescription}
                placeholder="Enter moment description (optional)"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.bg.layer2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontSize: 16,
                  minHeight: 100,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                onPress={handleCancelCreate}
                disabled={isCreating}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  alignItems: "center",
                  opacity: isCreating ? 0.5 : 1,
                }}
              >
                <TText>Cancel</TText>
              </Pressable>
              <Pressable
                onPress={handleSaveNewMoment}
                disabled={isCreating || !newMomentTitle.trim()}
                style={{
                  flex: 1,
                  borderRadius: radii.md,
                  overflow: "hidden",
                  opacity: isCreating || !newMomentTitle.trim() ? 0.5 : 1,
                }}
              >
                <LinearGradient
                  colors={[colors.accent.primary, colors.accent.primary]}
                  style={{ padding: spacing.md, alignItems: "center" }}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <TText style={{ color: "#fff", fontWeight: "bold" }}>Create</TText>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Edit Moment Bottom Sheet */}
      <BottomSheet visible={showEditSheet} onClose={handleCancelEdit} maxHeight="60%">
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
            Edit Moment
          </TText>

          <View style={{ gap: spacing.md }}>
            <View>
              <TText weight="medium" style={{ marginBottom: spacing.xs }}>
                Title
              </TText>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter moment title"
                placeholderTextColor={colors.text.muted}
                style={{
                  backgroundColor: colors.bg.layer2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontSize: 16,
                }}
              />
            </View>

            <View>
              <TText weight="medium" style={{ marginBottom: spacing.xs }}>
                Description
              </TText>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter moment description (optional)"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.bg.layer2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontSize: 16,
                  minHeight: 100,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                onPress={handleCancelEdit}
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
                onPress={handleSaveEdit}
                style={{
                  flex: 1,
                  borderRadius: radii.md,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={[colors.accent.primary, colors.accent.primary]}
                  style={{ padding: spacing.md, alignItems: "center" }}
                >
                  <TText style={{ color: "#fff", fontWeight: "bold" }}>Save</TText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Cancel Confirmation Modal */}
      <ModalConfirm
        visible={showCancelModal}
        title="Discard Changes?"
        message="All unsaved changes will be lost. Are you sure you want to cancel?"
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Delete Moment Confirmation Modal */}
      <ModalConfirm
        visible={showDeleteModal}
        title="Delete Moment?"
        message={
          deletingMoment?.mediaCount > 0
            ? `This moment contains ${deletingMoment.mediaCount} photo${deletingMoment.mediaCount !== 1 ? "s" : ""}. They will be moved to the default album. Are you sure you want to delete this moment?`
            : "Are you sure you want to delete this moment? This action cannot be undone."
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Screen>
  );
}
