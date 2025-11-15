import React, { useState } from "react";
import { View, Image, ScrollView, Pressable, Alert } from "react-native";
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

export default function TripSettings({ trip }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const canEdit = !!trip?.isCollaborator || trip?.ownerId === trip?.currentUserId;

  // Cover photo state
  const [coverPhoto, setCoverPhoto] = useState(null);

  // Invite management
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [inviteMethod, setInviteMethod] = useState(null); // "username" | "email" | "qr"
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState(null); // "collaborator" | "viewer" | null

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setCoverPhoto(result.assets[0]);
      // TODO: Upload to file storage and update trip cover photo
      Alert.alert("Success", "Cover photo updated successfully");
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

  const collaborators = Array.isArray(trip?.collaborators) ? trip.collaborators : [];
  const viewers = Array.isArray(trip?.viewers) ? trip.viewers : [];

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
          <Image 
            source={coverPhoto ? { uri: coverPhoto.uri } : { uri: trip?.coverUri }} 
            style={{ width: "100%", height: 160, backgroundColor: colors.bg.layer3 }}
            resizeMode="cover"
          />
          <View style={{ padding: spacing.lg }}>
            <TText weight="bold" style={{ marginBottom: spacing.xs }}>Cover Photo</TText>
            <TText dim size="sm" style={{ marginBottom: spacing.md }}>
              Shown at the top of the trip.
            </TText>
            <Button 
              title="Change cover photo" 
              onPress={handlePickImage} 
              disabled={!canEdit}
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

          {collaborators.length > 0 ? (
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

          {viewers.length > 0 ? (
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
