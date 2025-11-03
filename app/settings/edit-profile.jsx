import React, { useState, useEffect } from "react";
import { View, Image, Pressable, ScrollView, TextInput } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { spacing, radii } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";

// Demo: pretend we fetched this from API
const readOnly = {
  firstName: "Ožbej",
  lastName: "Pavc",
  dob: "2001-05-12",
  gender: "male",
  country: "Slovenia",
};

export default function EditProfile() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("Ozbej");
  const [username, setUsername] = useState("ozbej");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [bio, setBio] = useState("Traveler. Builder. Coffee enjoyer.");
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/150?img=11");
  const [cover, setCover] = useState("https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1600");

  const pickImage = async (setUri) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!res.canceled && res.assets?.length) setUri(res.assets[0].uri);
  };

  return (
    <Screen>
      <AppHeader title={t("settings.editProfile", { defaultValue: "Edit Profile Information" })} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xl }}>
        {/* Cover & avatar */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Pressable onPress={() => pickImage(setCover)}>
            <Image source={{ uri: cover }} style={{ width: "100%", height: 140 }} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Pressable onPress={() => pickImage(setAvatar)}>
              <Image
                source={{ uri: avatar }}
                style={{
                  width: 96, height: 96, borderRadius: 999, marginTop: -40,
                  borderWidth: 3, borderColor: colors.bg.layer1,
                }}
              />
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
            ["First name", readOnly.firstName],
            ["Last name", readOnly.lastName],
            ["Date of Birth", readOnly.dob],
            ["Gender", readOnly.gender],
            ["Country of origin", readOnly.country],
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

          <LabeledInput label="Display Name" value={displayName} onChangeText={setDisplayName} />
          <LabeledInput label="Username (1 per 90 days)" value={username} onChangeText={setUsername} />
          <LabeledTextArea label="Profile Description" value={bio} onChangeText={setBio} />

          <View style={{ height: spacing.md }} />
          <LabeledInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <LabeledInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Button title={t("save", { defaultValue: "Save" })} onPress={() => { /* submit */ }} />
            <Button title={t("cancel", { defaultValue: "Cancel" })} variant="outline" onPress={() => { /* reset */ }} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function LabeledInput({ label, value, onChangeText, secureTextEntry }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <TText dim size="sm">{label}</TText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: 12,
          paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: 4,
          color: colors.text.primary,
        }}
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}

function LabeledTextArea({ label, value, onChangeText }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <TText dim size="sm">{label}</TText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: 12,
          paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginTop: 4,
          color: colors.text.primary, textAlignVertical: "top",
        }}
        placeholderTextColor={colors.text.muted}
      />
    </View>
  );
}
