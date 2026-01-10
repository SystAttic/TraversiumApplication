import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, BackHandler } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import Accordion from "../../src/components/Accordion";
import ModalConfirm from "../../src/components/ModalConfirm";
import { spacing, radii } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { fetchMe } from "../../src/data/api";
import { updateUser } from "../../src/services/userApi";
import { uploadMediaFile } from "../../src/services/fileStorageApi";
import { getMediaFileUrl } from "../../src/services/fileStorageApi";
import AuthenticatedImage from "../../src/components/AuthenticatedImage";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function EditProfile() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [avatar, setAvatar] = useState(null); // Selected avatar image asset
  const [cover, setCover] = useState(null); // Selected cover image asset
  const [avatarPreview, setAvatarPreview] = useState(null); // Preview URI
  const [coverPreview, setCoverPreview] = useState(null); // Preview URI
  
  // Store initial values to detect changes
  const initialValuesRef = useRef({
    displayName: "",
    username: "",
    description: "",
    password: "",
    avatarPhotoReference: null,
    coverPhotoReference: null,
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!user) return false;
    return (
      displayName.trim() !== initialValuesRef.current.displayName ||
      username.trim() !== initialValuesRef.current.username ||
      description.trim() !== initialValuesRef.current.description ||
      password !== "" ||
      confirmPassword !== "" ||
      avatar !== null ||
      cover !== null
    );
  }, [user, displayName, username, description, password, confirmPassword, avatar, cover]);

  // Load user data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const userData = await fetchMe();
        if (!mounted) return;
        
        setUser(userData);
        const initialDisplayName = userData.displayName || "";
        const initialUsername = userData.username || "";
        const initialDescription = userData.description || "";
        
        setDisplayName(initialDisplayName);
        setUsername(initialUsername);
        setDescription(initialDescription);
        setAvatarPreview(userData.avatarPhotoReference ? getMediaFileUrl(userData.avatarPhotoReference) : null);
        setCoverPreview(userData.coverPhotoReference ? getMediaFileUrl(userData.coverPhotoReference) : null);
        
        // Store initial values
        initialValuesRef.current = {
          displayName: initialDisplayName,
          username: initialUsername,
          description: initialDescription,
          password: "",
          avatarPhotoReference: userData.avatarPhotoReference,
          coverPhotoReference: userData.coverPhotoReference,
        };
      } catch (error) {
        console.error("Failed to load user:", error);
        Alert.alert("Error", "Failed to load profile data. Please try again.");
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (hasUnsavedChanges()) {
        setShowCancelModal(true);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [hasUnsavedChanges]);

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const selectedImage = result.assets[0];
        if (type === "avatar") {
          setAvatar(selectedImage);
          setAvatarPreview(selectedImage.uri);
        } else {
          setCover(selectedImage);
          setCoverPreview(selectedImage.uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate password if provided
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }
    }

    // Validate username
    if (!username || username.trim().length === 0) {
      Alert.alert("Error", "Username is required");
      return;
    }

    setSaving(true);
    try {
      let avatarPhotoReference = user.avatarPhotoReference;
      let coverPhotoReference = user.coverPhotoReference;

      // Upload avatar if changed
      if (avatar) {
        setUploadingAvatar(true);
        try {
          const fileObj = {
            uri: avatar.uri,
            type: avatar.mimeType || avatar.type || "image/jpeg",
            name: avatar.fileName || avatar.filename || `avatar_${Date.now()}.jpg`,
          };
          const uploadResult = await uploadMediaFile(fileObj);
          avatarPhotoReference = uploadResult.filename;
        } catch (error) {
          console.error("Failed to upload avatar:", error);
          Alert.alert("Error", "Failed to upload avatar. Please try again.");
          setSaving(false);
          setUploadingAvatar(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Upload cover if changed
      if (cover) {
        setUploadingCover(true);
        try {
          const fileObj = {
            uri: cover.uri,
            type: cover.mimeType || cover.type || "image/jpeg",
            name: cover.fileName || cover.filename || `cover_${Date.now()}.jpg`,
          };
          const uploadResult = await uploadMediaFile(fileObj);
          coverPhotoReference = uploadResult.filename;
        } catch (error) {
          console.error("Failed to upload cover:", error);
          Alert.alert("Error", "Failed to upload cover photo. Please try again.");
          setSaving(false);
          setUploadingCover(false);
          return;
        } finally {
          setUploadingCover(false);
        }
      }

      // Update user
      const userDto = {
        userId: user.userId,
        username: username.trim(),
        email: user.email,
        displayName: displayName.trim() || username.trim(),
        description: description.trim() || null,
        avatarPhotoReference: avatarPhotoReference,
        coverPhotoReference: coverPhotoReference,
        firstName: user.firstName,
        lastName: user.lastName,
        countryOfOrigin: user.countryOfOrigin,
        gender: user.gender,
        firebaseId: user.firebaseId,
      };

      await updateUser(userDto);

      // Reset initial values after successful save
      initialValuesRef.current = {
        displayName: displayName.trim(),
        username: username.trim(),
        description: description.trim() || "",
        password: "",
        avatarPhotoReference: avatarPhotoReference,
        coverPhotoReference: coverPhotoReference,
      };
      
      // Clear password fields and image selections
      setPassword("");
      setConfirmPassword("");
      setAvatar(null);
      setCover(null);

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", error?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowCancelModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title={t("settings.editProfile", { defaultValue: "Edit Profile" })} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  // Header buttons
  const headerButtons = (
    <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
      <Pressable
        onPress={handleCancel}
        disabled={saving || uploadingAvatar || uploadingCover}
        hitSlop={10}
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        }}
      >
        <TText 
          style={{ 
            color: saving || uploadingAvatar || uploadingCover 
              ? colors.text.muted 
              : colors.text.primary 
          }}
          weight="medium"
        >
          {t("cancel", { defaultValue: "Cancel" })}
        </TText>
      </Pressable>
      <Pressable
        onPress={handleSave}
        disabled={saving || uploadingAvatar || uploadingCover || !hasUnsavedChanges()}
        hitSlop={10}
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          opacity: saving || uploadingAvatar || uploadingCover || !hasUnsavedChanges() ? 0.5 : 1,
        }}
      >
        <TText 
          style={{ color: colors.accent.primary }}
          weight="bold"
        >
          {saving ? t("saving", { defaultValue: "Saving..." }) : t("save", { defaultValue: "Save" })}
        </TText>
      </Pressable>
    </View>
  );

  return (
    <Screen>
      <AppHeader 
        title={t("settings.editProfile", { defaultValue: "Edit Profile" })} 
        showBell={false}
        rightElement={headerButtons}
      />
      <ScrollView 
        contentContainerStyle={{ 
          padding: spacing.xl, 
          paddingBottom: insets.bottom + spacing.xl 
        }}
      >
        {/* Cover & Avatar Accordion */}
        <Accordion 
          title={t("profile.photos", { defaultValue: "Photos" })}
          icon="images-outline"
          defaultExpanded={true}
        >
          <Card style={{ padding: 0, overflow: "hidden", marginTop: spacing.md }}>
            <Pressable 
              onPress={() => pickImage("cover")}
              disabled={uploadingCover}
            >
              {uploadingCover ? (
                <View style={{ 
                  width: "100%", 
                  height: 160, 
                  justifyContent: "center", 
                  alignItems: "center", 
                  backgroundColor: colors.bg.layer3 
                }}>
                  <ActivityIndicator size="large" color={colors.accent.primary} />
                  <TText dim style={{ marginTop: spacing.sm }}>
                    {t("uploadingCover", { defaultValue: "Uploading cover..." })}
                  </TText>
                </View>
              ) : (
                <View>
                  <AuthenticatedImage 
                    source={coverPreview 
                      ? { uri: coverPreview } 
                      : require("../../assets/cover-default.jpg")
                    } 
                    style={{ width: "100%", height: 160 }} 
                    resizeMode="cover"
                  />
                  <View style={{
                    position: "absolute",
                    top: spacing.md,
                    right: spacing.md,
                    backgroundColor: colors.overlay || "rgba(0,0,0,0.5)",
                    borderRadius: radii.pill,
                    padding: spacing.sm,
                  }}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </View>
              )}
            </Pressable>
            <View style={{ alignItems: "center", marginTop: -48 }}>
              <Pressable 
                onPress={() => pickImage("avatar")}
                disabled={uploadingAvatar}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                {uploadingAvatar ? (
                  <View style={{
                    width: 96, 
                    height: 96, 
                    borderRadius: 999, 
                    borderWidth: 4, 
                    borderColor: colors.bg.layer1,
                    backgroundColor: colors.bg.layer2,
                    justifyContent: "center", 
                    alignItems: "center",
                  }}>
                    <ActivityIndicator size="small" color={colors.accent.primary} />
                  </View>
                ) : (
                  <View>
                    <AuthenticatedImage
                      source={avatarPreview 
                        ? { uri: avatarPreview } 
                        : require("../../assets/profile-default.jpg")
                      }
                      style={{
                        width: 96, 
                        height: 96, 
                        borderRadius: 999, 
                        borderWidth: 4, 
                        borderColor: colors.bg.layer1,
                      }}
                      resizeMode="cover"
                    />
                    <View style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: colors.accent.primary,
                      borderRadius: 999,
                      padding: spacing.xs,
                      borderWidth: 2,
                      borderColor: colors.bg.layer1,
                    }}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  </View>
                )}
              </Pressable>
            </View>
            <View style={{ padding: spacing.lg, paddingTop: spacing.xl + 8, alignItems: "center" }}>
              <TText dim size="sm" style={{ textAlign: "center" }}>
                {t("tapToChange", { defaultValue: "Tap cover or avatar to change" })}
              </TText>
            </View>
          </Card>
        </Accordion>

        {/* Editable Fields Accordion */}
        <Accordion 
          title={t("profile.editable", { defaultValue: "Editable Information" })}
          icon="create-outline"
          defaultExpanded={true}
        >
          <View style={{ marginTop: spacing.md }}>
            <LabeledInput 
              label={t("profile.displayName", { defaultValue: "Display Name" })} 
              value={displayName} 
              onChangeText={setDisplayName}
              placeholder={t("profile.displayNamePlaceholder", { defaultValue: "Enter display name" })}
            />
            <LabeledInput 
              label={t("profile.username", { defaultValue: "Username" })} 
              value={username} 
              onChangeText={setUsername}
              placeholder={t("profile.usernamePlaceholder", { defaultValue: "Enter username" })}
            />
            <LabeledTextArea 
              label={t("profile.description", { defaultValue: "Profile Description" })} 
              value={description} 
              onChangeText={setDescription}
              placeholder={t("profile.descriptionPlaceholder", { defaultValue: "Tell us about yourself..." })}
            />

            <View style={{ 
              marginTop: spacing.lg, 
              paddingTop: spacing.lg, 
              borderTopWidth: 1, 
              borderTopColor: colors.border 
            }}>
              <TText weight="medium" size="sm" style={{ marginBottom: spacing.md }}>
                {t("profile.changePassword", { defaultValue: "Change Password (optional)" })}
              </TText>
              <LabeledInput 
                label={t("profile.newPassword", { defaultValue: "New Password" })} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry
                placeholder={t("profile.newPasswordPlaceholder", { defaultValue: "Leave empty to keep current password" })}
              />
              <LabeledInput 
                label={t("profile.confirmPassword", { defaultValue: "Confirm Password" })} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry
                placeholder={t("profile.confirmPasswordPlaceholder", { defaultValue: "Confirm new password" })}
              />
            </View>
          </View>
        </Accordion>

        {/* Read-only Fields Accordion */}
        <Accordion 
          title={t("profile.readonly", { defaultValue: "Profile Information (Read-only)" })}
          icon="information-circle-outline"
          defaultExpanded={false}
        >
          <View style={{ marginTop: spacing.md }}>
            {[
              [t("profile.firstName", { defaultValue: "First name" }), user?.firstName || "—"],
              [t("profile.lastName", { defaultValue: "Last name" }), user?.lastName || "—"],
              [t("profile.email", { defaultValue: "Email" }), user?.email || "—"],
              [t("profile.countryOfOrigin", { defaultValue: "Country of origin" }), user?.countryOfOrigin || "—"],
              [t("profile.gender", { defaultValue: "Gender" }), user?.gender || "—"],
            ].map(([label, val], i) => (
              <View 
                key={i} 
                style={{ 
                  marginBottom: spacing.md,
                  paddingBottom: spacing.md,
                  borderBottomWidth: i < 4 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <TText dim size="sm" style={{ marginBottom: spacing.xs }}>{label}</TText>
                <TText weight="medium">{val}</TText>
              </View>
            ))}
          </View>
        </Accordion>
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <ModalConfirm
        visible={showCancelModal}
        title={t("profile.cancelEditing", { defaultValue: "Cancel Editing Profile?" })}
        message={t("profile.cancelMessage", { 
          defaultValue: "Are you sure you want to cancel editing profile? New changes will not be saved unless pressed Save." 
        })}
        confirmText={t("yesCancel", { defaultValue: "Yes, Cancel" })}
        cancelText={t("continueEditing", { defaultValue: "Continue Editing" })}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </Screen>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, secureTextEntry }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <TText dim size="sm">{label}</TText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={{
          borderWidth: 1, 
          borderColor: colors.border, 
          borderRadius: radii.md,
          paddingHorizontal: spacing.md, 
          paddingVertical: 10, 
          marginTop: 4,
          color: colors.text.primary,
          backgroundColor: colors.bg.layer1,
        }}
      />
    </View>
  );
}

function LabeledTextArea({ label, value, onChangeText, placeholder }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <TText dim size="sm">{label}</TText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={{
          borderWidth: 1, 
          borderColor: colors.border, 
          borderRadius: radii.md,
          paddingHorizontal: spacing.md, 
          paddingVertical: spacing.md, 
          marginTop: 4,
          color: colors.text.primary,
          textAlignVertical: "top",
          backgroundColor: colors.bg.layer1,
          minHeight: 100,
        }}
      />
    </View>
  );
}
