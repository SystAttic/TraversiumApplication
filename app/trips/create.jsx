import React, { useState, useMemo } from "react";
import { View, ScrollView, TextInput, Pressable, Image, ActivityIndicator, Alert, Share } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import ModalConfirm from "../../src/components/ModalConfirm";
import ProgressSteps from "../../src/components/auth/ProgressSteps";
import SafeBottomBar from "../../src/components/SafeBottomBar";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { createTrip } from "../../src/services/tripApi";
import { auth } from "../../src/services/firebase";
import { uploadMediaFile } from "../../src/services/fileStorageApi";
import * as Clipboard from "expo-clipboard";

export default function CreateTripScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const total = 3;
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Step 1: Trip name
  const [tripName, setTripName] = useState("");

  // Step 2: Trip info
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE"); // PRIVATE or PUBLIC

  // Step 3: Created trip data
  const [createdTrip, setCreatedTrip] = useState(null);
  const [creating, setCreating] = useState(false);

  const canStep1 = useMemo(() => {
    return tripName.trim().length > 0;
  }, [tripName]);

  const canStep2 = useMemo(() => {
    // Description is optional, so we can always proceed
    return true;
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes defaults to images, so we can omit it or use the deprecated option
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setCoverPhoto(result.assets[0]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !canStep1) return;
    if (step === 2 && !canStep2) return;
    if (step < total) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateTrip = async () => {
    if (!canStep2) return;

    setCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create a trip");
        router.back();
        return;
      }

      // Upload cover photo if selected
      let coverPhotoUrl = null;
      if (coverPhoto) {
        try {
          const fileObj = {
            uri: coverPhoto.uri,
            type: coverPhoto.mimeType || coverPhoto.type || "image/jpeg",
            name: coverPhoto.fileName || coverPhoto.filename || `cover_${Date.now()}.jpg`,
          };
          
          const uploadResult = await uploadMediaFile(fileObj);
          coverPhotoUrl = uploadResult.fileID;
        } catch (error) {
          console.error("Failed to upload cover photo:", error);
          Alert.alert(
            "Upload Warning",
            "Failed to upload cover photo. Trip will be created without cover photo.",
            [
              { text: "Continue", style: "default" },
              { text: "Cancel", style: "cancel", onPress: () => setCreating(false) },
            ]
          );
          if (error.message?.includes("cancel")) {
            return;
          }
        }
      }

      const tripDto = {
        title: tripName.trim(),
        description: description.trim() || null,
        visibility: visibility,
        ownerId: user.uid,
        coverPhotoUrl: coverPhotoUrl,
      };

      const newTrip = await createTrip(tripDto);
      setCreatedTrip(newTrip);
      setStep(3);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to create trip. Please try again.");
      console.error("Create trip error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleGoBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    router.back();
  };

  const handleCopyLink = async () => {
    if (!createdTrip) return;
    
    // Generate invitation link (placeholder - will be enhanced with security later)
    const invitationLink = `traversium://trips/join?tripId=${createdTrip.tripId}&role=collaborator`;
    
    try {
      await Clipboard.setStringAsync(invitationLink);
      Alert.alert("Copied!", "Invitation link copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const handleShareLink = async () => {
    if (!createdTrip) return;
    
    // For now, use the deep link. Later this will be https://www.traversium.com/invite?id=...
    const invitationLink = `traversium://trips/join?tripId=${createdTrip.tripId}&role=collaborator`;
    
    try {
      await Share.share({
        message: invitationLink,
        title: "Share Trip Invitation",
      });
    } catch (error) {
      console.error("Share error:", error);
      // If sharing fails, fallback to copy
      await handleCopyLink();
    }
  };

  // Generate QR code data (placeholder - will be enhanced with security later)
  const qrData = createdTrip
    ? JSON.stringify({ tripId: createdTrip.tripId, role: "collaborator" })
    : null;

  return (
    <Screen>
      <AppHeader
        title="Create Trip"
        showBell={false}
        rightElement={
          <Pressable onPress={handleGoBack} hitSlop={10}>
            <TText style={{ color: colors.accent.primary }}>Go back</TText>
          </Pressable>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ padding: spacing.xl }}>
          <ProgressSteps total={total} current={step} />

          {/* Step 1: Trip Name */}
          {step === 1 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Name your trip
                </TText>
                <TText dim size="sm">Step 1 of {total}</TText>
              </View>

              <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                <View>
                  <TText weight="medium" size="sm" style={{ marginBottom: spacing.xs }}>
                    Trip Name
                  </TText>
                  <TextInput
                    placeholder="Enter trip name"
                    placeholderTextColor={colors.text.muted}
                    value={tripName}
                    onChangeText={setTripName}
                    style={{
                      borderWidth: 2,
                      borderColor: tripName.trim().length > 0 ? colors.status.success : colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      color: colors.text.primary,
                      fontSize: 16,
                    }}
                    autoFocus
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.xl }}>
                <Pressable
                  onPress={handleNext}
                  disabled={!canStep1}
                  style={{ borderRadius: 14, overflow: "hidden", minWidth: 110 }}
                >
                  <LinearGradient
                    colors={[
                      canStep1 ? colors.accent.primary : colors.bg.layer3,
                      canStep1 ? colors.accent.primary : colors.bg.layer3,
                    ]}
                    style={{ padding: 12, alignItems: "center" }}
                  >
                    <TText style={{ color: canStep1 ? "#fff" : colors.text.muted }}>Next</TText>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 2: Trip Info */}
          {step === 2 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Trip details
                </TText>
                <TText dim size="sm">Step 2 of {total}</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
                {/* Cover Photo */}
                <View>
                  <TText weight="medium" size="sm" style={{ marginBottom: spacing.xs }}>
                    Cover Photo (optional)
                  </TText>
                  <Pressable
                    onPress={handlePickImage}
                    style={{
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderStyle: "dashed",
                      borderRadius: radii.md,
                      padding: spacing.lg,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 150,
                      backgroundColor: colors.bg.layer2,
                    }}
                  >
                    {coverPhoto ? (
                      <Image
                        source={{ uri: coverPhoto.uri }}
                        style={{
                          width: "100%",
                          height: 150,
                          borderRadius: radii.md,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ alignItems: "center", gap: spacing.sm }}>
                        <Ionicons name="image-outline" size={48} color={colors.text.muted} />
                        <TText dim>Tap to add cover photo</TText>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Description */}
                <View>
                  <TText weight="medium" size="sm" style={{ marginBottom: spacing.xs }}>
                    Description (optional)
                  </TText>
                  <TextInput
                    placeholder="Describe your trip..."
                    placeholderTextColor={colors.text.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 2,
                      borderColor: description.trim().length > 0 ? colors.status.success : colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      color: colors.text.primary,
                      fontSize: 16,
                      minHeight: 100,
                      textAlignVertical: "top",
                    }}
                  />
                </View>

                {/* Visibility */}
                <View>
                  <TText weight="medium" size="sm" style={{ marginBottom: spacing.xs }}>
                    Visibility
                  </TText>
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <Pressable
                      onPress={() => setVisibility("PUBLIC")}
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: visibility === "PUBLIC" ? colors.accent.primary : colors.border,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        alignItems: "center",
                        backgroundColor: visibility === "PUBLIC" ? colors.accent.primary + "22" : "transparent",
                      }}
                    >
                      <Ionicons
                        name="globe-outline"
                        size={24}
                        color={visibility === "PUBLIC" ? colors.accent.primary : colors.text.muted}
                      />
                      <TText
                        weight={visibility === "PUBLIC" ? "bold" : "normal"}
                        style={{
                          marginTop: spacing.xs,
                          color: visibility === "PUBLIC" ? colors.accent.primary : colors.text.primary,
                        }}
                      >
                        Public
                      </TText>
                    </Pressable>
                    <Pressable
                      onPress={() => setVisibility("PRIVATE")}
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: visibility === "PRIVATE" ? colors.accent.primary : colors.border,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        alignItems: "center",
                        backgroundColor: visibility === "PRIVATE" ? colors.accent.primary + "22" : "transparent",
                      }}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={24}
                        color={visibility === "PRIVATE" ? colors.accent.primary : colors.text.muted}
                      />
                      <TText
                        weight={visibility === "PRIVATE" ? "bold" : "normal"}
                        style={{
                          marginTop: spacing.xs,
                          color: visibility === "PRIVATE" ? colors.accent.primary : colors.text.primary,
                        }}
                      >
                        Private
                      </TText>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xl }}>
                <Pressable onPress={handleBack} style={{ padding: 12 }}>
                  <TText>Back</TText>
                </Pressable>
                <Pressable
                  onPress={handleCreateTrip}
                  disabled={!canStep2 || creating}
                  style={{ borderRadius: 14, overflow: "hidden", minWidth: 110 }}
                >
                  <LinearGradient
                    colors={[
                      canStep2 && !creating ? colors.accent.primary : colors.bg.layer3,
                      canStep2 && !creating ? colors.accent.primary : colors.bg.layer3,
                    ]}
                    style={{ padding: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm }}
                  >
                    {creating ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <TText style={{ color: "#fff" }}>Creating...</TText>
                      </>
                    ) : (
                      <TText style={{ color: canStep2 ? "#fff" : colors.text.muted }}>Create Trip</TText>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 3: Invite Collaborators */}
          {step === 3 && createdTrip && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Invite collaborators
                </TText>
                <TText dim size="sm">Step 3 of {total}</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                {/* QR Code Placeholder */}
                <View>
                  <TText weight="medium" size="sm" style={{ marginBottom: spacing.md, textAlign: "center" }}>
                    Scan to join as collaborator
                  </TText>
                  <View
                    style={{
                      width: 250,
                      height: 250,
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      backgroundColor: colors.bg.layer2,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: spacing.md,
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={120} color={colors.text.muted} />
                    <TText dim size="sm" style={{ marginTop: spacing.sm, textAlign: "center" }}>
                      QR Code will be generated here
                    </TText>
                    <TText dim size="xs" style={{ marginTop: spacing.xs, textAlign: "center" }}>
                      (Security implementation pending)
                    </TText>
                  </View>
                </View>

                {/* Shareable Link */}
                <View style={{ width: "100%", gap: spacing.md }}>
                  <TText weight="medium" size="sm">Invitation Link</TText>
                  <View
                    style={{
                      flexDirection: "row",
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      backgroundColor: colors.bg.layer2,
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <TText
                      style={{ flex: 1, color: colors.text.primary }}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {`traversium://trips/join?tripId=${createdTrip.tripId}&role=collaborator`}
                    </TText>
                    <Pressable onPress={handleCopyLink} hitSlop={8}>
                      <Ionicons name="copy-outline" size={20} color={colors.accent.primary} />
                    </Pressable>
                    <Pressable
                      onPress={handleShareLink}
                      hitSlop={8}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radii.sm,
                        padding: spacing.xs,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="share-social" size={20} color={colors.status.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.xl }}>
                <Pressable
                  onPress={() => router.replace(`/trips/${createdTrip.tripId}`)}
                  style={{ borderRadius: 14, overflow: "hidden", minWidth: 110 }}
                >
                  <LinearGradient
                    colors={[colors.accent.primary, colors.accent.primary]}
                    style={{ padding: 12, alignItems: "center" }}
                  >
                    <TText style={{ color: "#fff" }}>Go to Trip</TText>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          )}
        </Card>
      </ScrollView>

      <SafeBottomBar backgroundColor={colors.bg.layer1} />

      {/* Cancel Confirmation Modal */}
      <ModalConfirm
        visible={showCancelModal}
        title="Cancel Trip Creation?"
        message="All entered data will not be saved. Are you sure you want to go back?"
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </Screen>
  );
}
