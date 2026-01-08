import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable, Image, ActivityIndicator, Alert, FlatList } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/theme";
import { spacing, radii } from "../../../src/theme/spacing";
import Screen from "../../../src/components/Screen";
import AppHeader from "../../../src/components/AppHeader";
import Card from "../../../src/components/Card";
import TText from "../../../src/components/TText";
import Button from "../../../src/components/Button";
import ProgressSteps from "../../../src/components/auth/ProgressSteps";
import SafeBottomBar from "../../../src/components/SafeBottomBar";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { uploadMediaFile, deleteMediaFile } from "../../../src/services/fileStorageApi";
import { addMediaToAlbum } from "../../../src/services/momentApi";
import { getTripById } from "../../../src/services/tripApi";
import { auth } from "../../../src/services/firebase";
import * as FileSystem from "expo-file-system";
import ProgressBar from "../../../src/components/ProgressBar";

export default function UploadMediaScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const total = 3;

  // Step 1: Selected images
  const [selectedImages, setSelectedImages] = useState([]);

  // Step 2: Upload progress
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileIds, setUploadedFileIds] = useState([]); // Track uploaded file IDs for rollback
  const [uploadError, setUploadError] = useState(null);

  // Step 3: Success/failure state
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const canStep1 = useMemo(() => {
    return selectedImages.length > 0;
  }, [selectedImages.length]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileType = (mimeType) => {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    return "image"; // default
  };

  const getFileFormat = (uri, mimeType) => {
    // Extract extension from URI or MIME type
    const uriExt = uri.split(".").pop()?.toLowerCase();
    if (uriExt && ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"].includes(uriExt)) {
      return uriExt;
    }
    // Fallback to MIME type
    if (mimeType) {
      const mimeExt = mimeType.split("/")[1]?.split(";")[0];
      if (mimeExt) return mimeExt;
    }
    return "jpg"; // default
  };

  const handleUpload = async () => {
    if (!canStep1 || uploading) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to upload media");
      router.back();
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFileIds([]);
    setUploadError(null);
    setStep(2);

    const uploadedFileIdsLocal = [];
    const errors = [];
    let defaultAlbumId = null;

    try {
      // Ensure tripId is a number (long)
      const finalTripId = Array.isArray(tripId) ? tripId[0] : tripId;
      const tripIdNum = Number(finalTripId);
      
      if (!tripIdNum || isNaN(tripIdNum)) {
        throw new Error("Invalid trip ID");
      }

      // Step 0: Get the trip data and extract the default album ID
      try {
        const trip = await getTripById(tripIdNum);
        defaultAlbumId = trip.defaultAlbum;
        console.log("Found default album with ID:", defaultAlbumId);
      } catch (error) {
        console.error("Failed to get trip:", error);
        console.log("Trip ID:", tripIdNum);
        throw new Error("Trip not found. Please ensure the trip exists and has a default album.");
      }

      if (!defaultAlbumId) {
        throw new Error("Could not determine default album ID. The trip may not have a default album.");
      }

      // Step 1 & 2: Upload files sequentially (file storage -> trip service -> next file)
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        let fileId = null;

        try {
          // Get file size - use from asset if available, otherwise get from file system
          let fileSize = image.fileSize || 0;
          if (!fileSize) {
            const fileInfo = await FileSystem.getInfoAsync(image.uri);
            fileSize = fileInfo.exists ? fileInfo.size : 0;
          }

          // Prepare file object for upload
          const fileObj = {
            uri: image.uri,
            type: image.mimeType || image.type || "image/jpeg",
            name: image.fileName || image.filename || `image_${i}.jpg`,
          };

          // Upload to file storage
          const uploadResult = await uploadMediaFile(fileObj);
          fileId = uploadResult.filename;
          uploadedFileIdsLocal.push(fileId);
          setUploadedFileIds([...uploadedFileIdsLocal]);

          // Update progress (50% for file storage upload)
          setUploadProgress(((i + 0.5) / selectedImages.length) * 100);

          // Immediately add media metadata to tripService (default album)
          const mimeType = image.mimeType || image.type;
          const fileType = getFileType(mimeType);
          const fileFormat = getFileFormat(image.uri, mimeType);

          const mediaDto = {
            pathUrl: fileId, // The fileID from file storage service
            uploader: user.uid,
            fileType: fileType,
            fileFormat: fileFormat,
            fileSize: fileSize,
            geoLocation: null, // TODO: Extract from EXIF if available
          };

          await addMediaToAlbum(defaultAlbumId, mediaDto);

          // Update progress (50% + 50% for trip service)
          setUploadProgress(((i + 1) / selectedImages.length) * 100);
        } catch (error) {
          console.error(`Failed to upload file ${i}:`, error);
          errors.push({ index: i, error: error.message || "Upload failed" });

          // If file was uploaded to storage but failed to add to trip service, delete it
          if (fileId) {
            try {
              await deleteMediaFile(fileId);
              const index = uploadedFileIdsLocal.indexOf(fileId);
              if (index > -1) {
                uploadedFileIdsLocal.splice(index, 1);
                setUploadedFileIds([...uploadedFileIdsLocal]);
              }
            } catch (deleteError) {
              console.error(`Failed to delete file ${fileId} during rollback:`, deleteError);
            }
          }

          // Continue with next file instead of stopping
        }
      }

      if (errors.length > 0 && uploadedFileIdsLocal.length === 0) {
        // All uploads failed
        throw new Error("Failed to upload any files. Please try again.");
      }

      if (errors.length > 0) {
        // Some files failed, but some succeeded
        const errorMsg = `${errors.length} file(s) failed to upload. ${uploadedFileIdsLocal.length} file(s) uploaded successfully.`;
        Alert.alert("Partial Upload", errorMsg);
      }

      // Success!
      setUploadSuccess(true);
      setUploadProgress(100);
      setStep(3);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Upload failed. Please try again.");
      setUploadSuccess(false);
      setStep(3);

      // Rollback: Delete any successfully uploaded files
      if (uploadedFileIds.length > 0) {
        for (const fileId of uploadedFileIds) {
          try {
            await deleteMediaFile(fileId);
          } catch (deleteError) {
            console.error(`Failed to delete file ${fileId} during rollback:`, deleteError);
          }
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    if (step > 1 && !uploading) {
      setStep(step - 1);
    }
  };

  const handleGoBack = () => {
    if (uploading) {
      Alert.alert("Upload in Progress", "Please wait for the upload to complete.");
      return;
    }
    router.back();
  };

  const handleManualArrangement = () => {
    // Pass uploaded file IDs (pathUrls) so manual-arrange only shows newly uploaded media
    router.push({
      pathname: `/trips/${tripId}/upload/manual-arrange`,
      params: {
        uploadedFileIds: JSON.stringify(uploadedFileIds),
      },
    });
  };

  const handleAutoArrangement = () => {
    router.push(`/trips/${tripId}/upload/auto-arrange`);
  };

  const handleDoLater = () => {
    router.replace(`/trips/${tripId}`);
  };

  return (
    <Screen>
      <AppHeader
        title="Upload Media"
        showBell={false}
        rightElement={
          <Pressable onPress={handleGoBack} hitSlop={10}>
            <TText style={{ color: colors.accent.primary }}>Cancel</TText>
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

          {/* Step 1: Select Images */}
          {step === 1 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Select images to upload
                </TText>
                <TText dim size="sm">Step 1 of {total}</TText>
              </View>

              <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                {/* Image Preview Grid */}
                {selectedImages.length > 0 && (
                  <View>
                    <TText weight="medium" size="sm" style={{ marginBottom: spacing.xs }}>
                      Selected Images ({selectedImages.length})
                    </TText>
                    <FlatList
                      data={selectedImages}
                      numColumns={3}
                      scrollEnabled={false}
                      keyExtractor={(item, index) => `${item.uri}-${index}`}
                      columnWrapperStyle={{ gap: spacing.sm }}
                      contentContainerStyle={{ gap: spacing.sm }}
                      renderItem={({ item, index }) => (
                        <View style={{ flex: 1, aspectRatio: 1, position: "relative" }}>
                          <Image
                            source={{ uri: item.uri }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: radii.md,
                            }}
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => handleRemoveImage(index)}
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: colors.status.danger,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            hitSlop={4}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </Pressable>
                        </View>
                      )}
                    />
                  </View>
                )}

                {/* Add Images Button */}
                <Pressable
                  onPress={handlePickImages}
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                    borderRadius: radii.md,
                    padding: spacing.lg,
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 100,
                    backgroundColor: colors.bg.layer2,
                  }}
                >
                  <View style={{ alignItems: "center", gap: spacing.sm }}>
                    <Ionicons name="images-outline" size={48} color={colors.text.muted} />
                    <TText dim>Tap to select images</TText>
                    <TText dim size="sm">You can select multiple images</TText>
                  </View>
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.xl }}>
                <Pressable
                  onPress={handleUpload}
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
                    <TText style={{ color: canStep1 ? "#fff" : colors.text.muted }}>Upload</TText>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 2: Upload Progress */}
          {step === 2 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Uploading media
                </TText>
                <TText dim size="sm">Step 2 of {total}</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <View style={{ width: "100%" }}>
                  <ProgressBar value={uploadProgress} max={100} />
                  <TText dim size="sm" style={{ textAlign: "center", marginTop: spacing.xs }}>
                    {Math.round(uploadProgress)}% complete
                  </TText>
                </View>
                <TText dim style={{ textAlign: "center" }}>
                  Please wait while we upload your media...
                </TText>
              </View>
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm, marginTop: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  {uploadSuccess ? "Upload complete!" : "Upload failed"}
                </TText>
                <TText dim size="sm">Step 3 of {total}</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                {uploadSuccess ? (
                  <>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.status.success + "22",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={48} color={colors.status.success} />
                    </View>
                    <TText weight="bold" style={{ fontSize: 18, textAlign: "center" }}>
                      Hooray, your media has been successfully uploaded!
                    </TText>
                    <TText dim style={{ textAlign: "center", marginTop: spacing.md }}>
                      Now that your media is safely stored it is time to get it organized:
                    </TText>

                    <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
                      <Pressable
                        onPress={handleManualArrangement}
                        style={{
                          borderWidth: 2,
                          borderColor: colors.accent.primary,
                          borderRadius: radii.md,
                          padding: spacing.lg,
                          alignItems: "center",
                          backgroundColor: colors.accent.primary + "22",
                        }}
                      >
                        <Ionicons name="create-outline" size={32} color={colors.accent.primary} />
                        <TText weight="bold" style={{ marginTop: spacing.sm, color: colors.accent.primary }}>
                          Manual Moment Arrangement
                        </TText>
                        <TText dim size="sm" style={{ marginTop: spacing.xs, textAlign: "center" }}>
                          Organize your media into moments yourself
                        </TText>
                      </Pressable>

                      <Pressable
                        onPress={handleAutoArrangement}
                        style={{
                          borderWidth: 2,
                          borderColor: colors.accent.primary,
                          borderRadius: radii.md,
                          padding: spacing.lg,
                          alignItems: "center",
                          backgroundColor: colors.accent.primary + "22",
                        }}
                      >
                        <Ionicons name="sparkles-outline" size={32} color={colors.accent.primary} />
                        <TText weight="bold" style={{ marginTop: spacing.sm, color: colors.accent.primary }}>
                          Auto Moment Arrangement
                        </TText>
                        <TText dim size="sm" style={{ marginTop: spacing.xs, textAlign: "center" }}>
                          Let us organize your media automatically
                        </TText>
                      </Pressable>

                      <Pressable
                        onPress={handleDoLater}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radii.md,
                          padding: spacing.md,
                          alignItems: "center",
                        }}
                      >
                        <TText>I'll do that later</TText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.status.danger + "22",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close-circle" size={48} color={colors.status.danger} />
                    </View>
                    <TText weight="bold" style={{ fontSize: 18, textAlign: "center" }}>
                      Sorry, the upload did not go through.
                    </TText>
                    <TText dim style={{ textAlign: "center", marginTop: spacing.md }}>
                      We are sorry for inconveniences so please try again later.
                    </TText>
                    {uploadError && (
                      <TText dim size="sm" style={{ textAlign: "center", marginTop: spacing.xs, color: colors.status.danger }}>
                        {uploadError}
                      </TText>
                    )}

                    <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
                      <Pressable
                        onPress={() => {
                          setStep(1);
                          setUploadError(null);
                        }}
                        style={{
                          borderRadius: 14,
                          overflow: "hidden",
                          minWidth: 110,
                        }}
                      >
                        <LinearGradient
                          colors={[colors.accent.primary, colors.accent.primary]}
                          style={{ padding: 12, alignItems: "center" }}
                        >
                          <TText style={{ color: "#fff" }}>Try Again</TText>
                        </LinearGradient>
                      </Pressable>
                      <Pressable
                        onPress={handleGoBack}
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
                  </>
                )}
              </View>
            </>
          )}
        </Card>
      </ScrollView>

      <SafeBottomBar backgroundColor={colors.bg.layer1} />
    </Screen>
  );
}

