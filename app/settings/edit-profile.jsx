import React, { useState, useEffect } from "react";
import { View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
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

export default function EditProfile() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
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

  // Load user data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const userData = await fetchMe();
        if (!mounted) return;
        
        setUser(userData);
        setDisplayName(userData.displayName || "");
        setUsername(userData.username || "");
        setDescription(userData.description || "");
        setAvatarPreview(userData.avatarPhotoReference ? getMediaFileUrl(userData.avatarPhotoReference) : null);
        setCoverPreview(userData.coverPhotoReference ? getMediaFileUrl(userData.coverPhotoReference) : null);
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

  return (
    <Screen>
      <AppHeader title={t("settings.editProfile", { defaultValue: "Edit Profile" })} />
      <ScrollView 
        contentContainerStyle={{ 
          padding: spacing.xl, 
          gap: spacing.lg, 
          paddingBottom: insets.bottom + spacing.xl 
        }}
      >
        {/* Cover & avatar */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Pressable 
            onPress={() => pickImage("cover")}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <View style={{ width: "100%", height: 140, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg.layer2 }}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <TText dim style={{ marginTop: spacing.sm }}>Uploading cover...</TText>
              </View>
            ) : (
              <AuthenticatedImage 
                source={coverPreview 
                  ? { uri: coverPreview } 
                  : require("../../assets/cover-default.jpg")
                } 
                style={{ width: "100%", height: 140 }} 
                resizeMode="cover"
              />
            )}
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Pressable 
              onPress={() => pickImage("avatar")}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <View style={{
                  width: 96, height: 96, borderRadius: 999, marginTop: -40,
                  borderWidth: 3, borderColor: colors.bg.layer1,
                  backgroundColor: colors.bg.layer2,
                  justifyContent: "center", alignItems: "center",
                }}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : (
                <AuthenticatedImage
                  source={avatarPreview 
                    ? { uri: avatarPreview } 
                    : require("../../assets/profile-default.jpg")
                  }
                  style={{
                    width: 96, height: 96, borderRadius: 999, marginTop: -40,
                    borderWidth: 3, borderColor: colors.bg.layer1,
                  }}
                  resizeMode="cover"
                />
              )}
            </Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            <TText dim>{t("tapToChange", { defaultValue: "Tap cover or avatar to change" })}</TText>
          </View>
        </Card>

        {/* Read-only fields */}
        <Card>
          <TText weight="bold" size="md" style={{ marginBottom: spacing.sm }}>
            {t("profile.readonly", { defaultValue: "Profile (read-only)" })}
          </TText>
          {[
            ["First name", user?.firstName || "—"],
            ["Last name", user?.lastName || "—"],
            ["Email", user?.email || "—"],
            ["Country of origin", user?.countryOfOrigin || "—"],
            ["Gender", user?.gender || "—"],
          ].map(([label, val], i) => (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              <TText dim size="sm">{label}</TText>
              <TText>{val}</TText>
            </View>
          ))}
        </Card>

        {/* Editable fields */}
        <Card>
          <TText weight="bold" size="md" style={{ marginBottom: spacing.sm }}>
            {t("profile.editable", { defaultValue: "Editable" })}
          </TText>

          <LabeledInput 
            label="Display Name" 
            value={displayName} 
            onChangeText={setDisplayName}
            placeholder="Enter display name"
          />
          <LabeledInput 
            label="Username" 
            value={username} 
            onChangeText={setUsername}
            placeholder="Enter username"
          />
          <LabeledTextArea 
            label="Profile Description" 
            value={description} 
            onChangeText={setDescription}
            placeholder="Tell us about yourself..."
          />

          <View style={{ height: spacing.md }} />
          <TText weight="medium" size="sm" style={{ marginBottom: spacing.sm }}>
            Change Password (optional)
          </TText>
          <LabeledInput 
            label="New Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry
            placeholder="Leave empty to keep current password"
          />
          <LabeledInput 
            label="Confirm Password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry
            placeholder="Confirm new password"
          />

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Button 
              title={t("save", { defaultValue: "Save" })} 
              onPress={handleSave}
              disabled={saving || uploadingAvatar || uploadingCover}
              style={{ flex: 1 }}
            />
            <Button 
              title={t("cancel", { defaultValue: "Cancel" })} 
              variant="outline" 
              onPress={handleCancel}
              disabled={saving || uploadingAvatar || uploadingCover}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </ScrollView>
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
