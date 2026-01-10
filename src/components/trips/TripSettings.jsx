import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Card from "../Card";
import TText from "../TText";
import Button from "../Button";
import Input from "../Input";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../../theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "../BottomSheet";
import UserRow from "../users/UserRow";
import { router } from "expo-router";
import { TRIP_BAR_BASE_HEIGHT } from "./TripBottomBar";
import { uploadMediaFile } from "../../services/fileStorageApi";
import { updateTrip, getTripById } from "../../services/tripApi";
import { getMediaFileUrl } from "../../services/fileStorageApi";
import { getUserById } from "../../services/userApi";
import AuthenticatedImage from "../AuthenticatedImage";

export default function TripSettings({ trip, onTripUpdate }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const canEdit = trip?.isCollaborator || trip?.ownerId === trip?.currentUserId;
  
  const [collaboratorsWithInfo, setCollaboratorsWithInfo] = useState([]);
  const [viewersWithInfo, setViewersWithInfo] = useState([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Cover photo state
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Invite management
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [inviteMethod, setInviteMethod] = useState(null); // "username" | "email" | "qr"
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState(null); // "collaborator" | "viewer" | null

  const handlePickImage = async () => {
    if (!canEdit) {
      Alert.alert("Permission Denied", "You don't have permission to change the cover photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const selectedPhoto = result.assets[0];
      setCoverPhoto(selectedPhoto);
      setUploadingCover(true);

      try {
        // Upload cover photo to file storage
        const fileObj = {
          uri: selectedPhoto.uri,
          type: selectedPhoto.mimeType || selectedPhoto.type || "image/jpeg",
          name: selectedPhoto.fileName || selectedPhoto.filename || `cover_${Date.now()}.jpg`,
        };

        const uploadResult = await uploadMediaFile(fileObj);
        const coverPhotoUrl = uploadResult.filename;

        // Fetch the raw trip data to get the correct structure for update
        const tripIdNum = Number(trip.tripId || trip.id);
        if (!tripIdNum || isNaN(tripIdNum)) {
          throw new Error("Invalid trip ID");
        }

        const rawTripData = await getTripById(tripIdNum);

        // Update trip with new cover photo URL
        const tripDto = {
          tripId: rawTripData.tripId,
          title: rawTripData.title || "",
          description: rawTripData.description || null,
          visibility: rawTripData.visibility || "PRIVATE",
          ownerId: rawTripData.ownerId,
          coverPhotoUrl: coverPhotoUrl, // Use the uploaded file ID
          collaborators: rawTripData.collaborators || [],
          viewers: rawTripData.viewers || [],
          defaultAlbum: rawTripData.defaultAlbum || null,
          albums: rawTripData.albums || [],
        };

        const updatedTrip = await updateTrip(tripDto);
        
        // Notify parent component to refresh trip data
        if (onTripUpdate) {
          onTripUpdate(updatedTrip);
        }

        // Update local state to reflect the new cover photo
        setCoverPhoto({
          ...selectedPhoto,
          uri: getMediaFileUrl(coverPhotoUrl), // Use the uploaded file URL
        });

        Alert.alert("Success", "Cover photo updated successfully");
      } catch (error) {
        console.error("Failed to upload cover photo:", error);
        Alert.alert("Error", error?.message || "Failed to upload cover photo. Please try again.");
        // Reset cover photo on error
        setCoverPhoto(null);
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleInvite = (role) => {
    if (!inviteValue.trim()) {
      Alert.alert("Error", `Please enter ${inviteMethod === "username" ? "a username" : inviteMethod === "email" ? "an email address" : "QR code"}`);
      return;
    }
    // TODO: Call API to invite user
    Alert.alert("Invite Sent", `Invitation sent to ${inviteValue} as ${role}`);
    setInviteValue("");
    setInviteMethod(null);
    setShowInviteSheet(false);
  };

  // Fetch user information for collaborators
  useEffect(() => {
    const collaboratorIds = Array.isArray(trip?.collaborators) ? trip.collaborators : [];
    if (collaboratorIds.length === 0) {
      setCollaboratorsWithInfo([]);
      return;
    }

    let on = true;
    setLoadingCollaborators(true);

    (async () => {
      try {
        const collaboratorPromises = collaboratorIds.map(async (item) => {
          // Handle both cases: item might be a string (firebaseId) or an object with id property
          const firebaseId = typeof item === 'string' ? item : (item?.id || item?.firebaseId);
          if (!firebaseId) {
            console.error('Invalid collaborator item:', item);
            return null;
          }
          
          try {
            const user = await getUserById(firebaseId);
            return {
              id: firebaseId,
              username: user.username || firebaseId,
              displayName: user.displayName || user.username || firebaseId,
              avatarPhotoReference: user.avatarPhotoReference,
            };
          } catch (error) {
            console.error(`Failed to fetch collaborator ${firebaseId}:`, error);
            return {
              id: firebaseId,
              username: firebaseId,
              displayName: firebaseId,
              avatarPhotoReference: null,
            };
          }
        });

        const collaborators = (await Promise.all(collaboratorPromises)).filter(Boolean);
        if (on) setCollaboratorsWithInfo(collaborators);
      } catch (error) {
        console.error("Failed to fetch collaborators:", error);
        if (on) setCollaboratorsWithInfo([]);
      } finally {
        if (on) setLoadingCollaborators(false);
      }
    })();

    return () => { on = false; };
  }, [trip?.collaborators]);

  // Fetch user information for viewers
  useEffect(() => {
    const viewerIds = Array.isArray(trip?.viewers) ? trip.viewers : [];
    if (viewerIds.length === 0) {
      setViewersWithInfo([]);
      return;
    }

    let on = true;
    setLoadingViewers(true);

    (async () => {
      try {
        const viewerPromises = viewerIds.map(async (item) => {
          // Handle both cases: item might be a string (firebaseId) or an object with id property
          const firebaseId = typeof item === 'string' ? item : (item?.id || item?.firebaseId);
          if (!firebaseId) {
            console.error('Invalid viewer item:', item);
            return null;
          }
          
          try {
            const user = await getUserById(firebaseId);
            return {
              id: firebaseId,
              username: user.username || firebaseId,
              displayName: user.displayName || user.username || firebaseId,
              avatarPhotoReference: user.avatarPhotoReference,
            };
          } catch (error) {
            console.error(`Failed to fetch viewer ${firebaseId}:`, error);
            return {
              id: firebaseId,
              username: firebaseId,
              displayName: firebaseId,
              avatarPhotoReference: null,
            };
          }
        });

        const viewers = (await Promise.all(viewerPromises)).filter(Boolean);
        if (on) setViewersWithInfo(viewers);
      } catch (error) {
        console.error("Failed to fetch viewers:", error);
        if (on) setViewersWithInfo([]);
      } finally {
        if (on) setLoadingViewers(false);
      }
    })();

    return () => { on = false; };
  }, [trip?.viewers]);

  const handleRemoveUser = (userId, role) => {
    Alert.alert(
      "Remove User",
      `Are you sure you want to remove this ${role}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // TODO: Call API to remove user
            Alert.alert("Success", "User removed successfully");
          },
        },
      ]
    );
  };

  const collaborators = collaboratorsWithInfo;
  const viewers = viewersWithInfo;

  return (
    <>
      <ScrollView 
        contentContainerStyle={{ 
          padding: spacing.xl, 
          paddingBottom: TRIP_BAR_BASE_HEIGHT + insets.bottom + spacing.xl 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: spacing.lg }}>
          {(coverPhoto || trip?.coverPhotoUrl || trip?.coverUri) && (
            <AuthenticatedImage 
              source={
                coverPhoto 
                  ? { uri: coverPhoto.uri } 
                  : trip?.coverPhotoUrl 
                    ? { uri: getMediaFileUrl(trip.coverPhotoUrl) }
                    : trip?.coverUri 
                      ? { uri: trip.coverUri }
                      : null
              } 
              style={{ width: "100%", height: 160, backgroundColor: colors.bg.layer3 }}
              resizeMode="cover"
            />
          )}
          <View style={{ padding: spacing.lg }}>
            <TText weight="bold" style={{ marginBottom: spacing.xs }}>Cover Photo</TText>
            <TText dim size="sm" style={{ marginBottom: spacing.md }}>
              Shown at the top of the trip.
            </TText>
            <Button 
              title={uploadingCover ? "Uploading..." : "Change cover photo"} 
              onPress={handlePickImage} 
              disabled={!canEdit || uploadingCover}
              loading={uploadingCover}
            />
          </View>
        </Card>

        {/* Trip Information */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <TText weight="bold">Trip Information</TText>
            {canEdit && (
              <Pressable onPress={() => router.push(`/trips/${trip?.id}/edit`)}>
                <Ionicons name="create-outline" size={20} color={colors.accent.primary} />
              </Pressable>
            )}
          </View>

          <View style={{ marginBottom: spacing.sm }}>
            <TText dim size="sm" style={{ marginBottom: spacing.xs }}>Title</TText>
            <TText weight="medium">{trip?.title || "Untitled Trip"}</TText>
          </View>

          {!!trip?.description && (
            <View style={{ marginBottom: spacing.sm }}>
              <TText dim size="sm" style={{ marginBottom: spacing.xs }}>Description</TText>
              <TText>{trip.description}</TText>
            </View>
          )}

          <View style={{ marginBottom: spacing.sm }}>
            <TText dim size="sm" style={{ marginBottom: spacing.xs }}>Visibility</TText>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons 
                name={trip?.visibility === "PUBLIC" ? "globe-outline" : "lock-closed-outline"} 
                size={16} 
                color={colors.text.primary}
                style={{ marginRight: spacing.xs }}
              />
              <TText>{trip?.visibility === "PUBLIC" ? "Public" : "Private"}</TText>
            </View>
          </View>
        </Card>

        {/* Collaborators */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <TText weight="bold">Collaborators</TText>
            {canEdit && (
              <Pressable 
                onPress={() => {
                  setInviteMethod(null);
                  setInviteValue("");
                  setInviteRole("collaborator");
                  setShowInviteSheet(true);
                }}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.accent.primary} style={{ marginRight: spacing.xs }} />
                <TText size="sm" style={{ color: colors.accent.primary }}>Invite</TText>
              </Pressable>
            )}
          </View>

          {loadingCollaborators ? (
            <View style={{ alignItems: "center", padding: spacing.md }}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : collaborators.length > 0 ? (
            <>
              <View style={{ marginBottom: spacing.md }}>
                {collaborators.slice(0, 3).map((c, idx) => (
                  <View key={c.id || idx} style={{ marginBottom: spacing.sm }}>
                    <UserRow
                      user={c}
                      rightKind="none"
                    />
                  </View>
                ))}
              </View>
              {collaborators.length > 3 && (
                <TText dim size="sm" style={{ marginBottom: spacing.sm }}>
                  +{collaborators.length - 3} more collaborator{collaborators.length - 3 !== 1 ? "s" : ""}
                </TText>
              )}
            </>
          ) : (
            <TText dim size="sm" style={{ marginBottom: spacing.md }}>
              No collaborators yet.
            </TText>
          )}

          <Button 
            title="View all collaborators" 
            variant="outline"
            onPress={() => router.push(`/trips/${trip?.id}/collaborators`)}
            disabled={!canEdit && collaborators.length === 0}
          />
        </Card>

        {/* Viewers */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <TText weight="bold">Viewers</TText>
            {canEdit && (
              <Pressable 
                onPress={() => {
                  setInviteMethod(null);
                  setInviteValue("");
                  setInviteRole("viewer");
                  setShowInviteSheet(true);
                }}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.accent.primary} style={{ marginRight: spacing.xs }} />
                <TText size="sm" style={{ color: colors.accent.primary }}>Invite</TText>
              </Pressable>
            )}
          </View>

          {loadingViewers ? (
            <View style={{ alignItems: "center", padding: spacing.md }}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : viewers.length > 0 ? (
            <>
              <View style={{ marginBottom: spacing.md }}>
                {viewers.slice(0, 3).map((v, idx) => (
                  <View key={v.id || idx} style={{ marginBottom: spacing.sm }}>
                    <UserRow
                      user={v}
                      rightKind="none"
                    />
                  </View>
                ))}
              </View>
              {viewers.length > 3 && (
                <TText dim size="sm" style={{ marginBottom: spacing.sm }}>
                  +{viewers.length - 3} more viewer{viewers.length - 3 !== 1 ? "s" : ""}
                </TText>
              )}
            </>
          ) : (
            <TText dim size="sm" style={{ marginBottom: spacing.md }}>
              No viewers yet.
            </TText>
          )}

          <Button 
            title="View all viewers" 
            variant="outline"
            onPress={() => router.push(`/trips/${trip?.id}/viewers`)}
            disabled={!canEdit && viewers.length === 0}
          />
        </Card>

        {!canEdit && (
          <Card inset>
            <TText dim size="sm" style={{ textAlign: "center" }}>
              You're viewing as a viewer. Editing is disabled.
            </TText>
          </Card>
        )}
      </ScrollView>

      {/* Invite User Bottom Sheet */}
      <BottomSheet visible={showInviteSheet} onClose={() => {
        setShowInviteSheet(false);
        setInviteMethod(null);
        setInviteValue("");
        setInviteRole(null);
      }} maxHeight="60%">
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.lg }}>
            Invite User
          </TText>

          {!inviteMethod ? (
            <>
              <TText dim size="sm" style={{ marginBottom: spacing.md }}>
                Choose how you want to invite:
              </TText>
              <Button
                title="Invite by Username"
                onPress={() => setInviteMethod("username")}
                style={{ marginBottom: spacing.sm }}
                left={<Ionicons name="person-outline" size={20} color="#fff" />}
              />
              <Button
                title="Invite by Email"
                onPress={() => setInviteMethod("email")}
                style={{ marginBottom: spacing.sm }}
                left={<Ionicons name="mail-outline" size={20} color="#fff" />}
              />
              <Button
                title="Invite by QR Code"
                variant="outline"
                onPress={() => {
                  setShowInviteSheet(false);
                  router.push({
                    pathname: `/trips/${trip?.id}/qr-invite`,
                    params: { role: inviteRole || "collaborator" },
                  });
                }}
                left={<Ionicons name="qr-code-outline" size={20} color={colors.accent.primary} />}
              />
            </>
          ) : (
            <>
              <Input
                label={inviteMethod === "username" ? "Username" : "Email Address"}
                value={inviteValue}
                onChangeText={setInviteValue}
                placeholder={inviteMethod === "username" ? "@username" : "user@example.com"}
                keyboardType={inviteMethod === "email" ? "email-address" : "default"}
                autoCapitalize="none"
              />

              <View style={{ marginTop: spacing.md }}>
                {inviteRole === "collaborator" ? (
                  <Button
                    title="Invite as Collaborator"
                    onPress={() => handleInvite("collaborator")}
                    style={{ marginBottom: spacing.sm }}
                  />
                ) : inviteRole === "viewer" ? (
                  <Button
                    title="Invite as Viewer"
                    onPress={() => handleInvite("viewer")}
                    style={{ marginBottom: spacing.sm }}
                  />
                ) : null}
                <Button
                  title="Back"
                  variant="ghost"
                  onPress={() => {
                    setInviteMethod(null);
                    setInviteValue("");
                  }}
                />
              </View>
            </>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
