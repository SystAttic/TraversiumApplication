import React, { useState, useEffect } from "react";
import { View, ScrollView, Dimensions, Pressable, Share, Alert } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import { spacing, radii } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMe } from "../../src/data/api";
import QRCode from "react-native-qrcode-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const QR_SIZE = Math.min(SCREEN_WIDTH - spacing.xl * 4, 280);

export default function MyQRCodeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userData = await fetchMe();
        if (!mounted) return;
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
        Alert.alert("Error", "Failed to load profile data. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const username = user?.username || "";
  const qrData = username;

  const handleShare = async () => {
    if (!username) return;
    try {
      await Share.share({
        message: `My Traversium username: ${username}`,
        title: "My Traversium Username",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopy = async () => {
    if (!username) return;
    try {
      await Clipboard.setStringAsync(username);
      Alert.alert("Copied", "Username copied to clipboard");
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title={t("settings.myQRCode", { defaultValue: "My QR Code" })} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <TText dim>Loading...</TText>
        </View>
      </Screen>
    );
  }

  if (!username) {
    return (
      <Screen>
        <AppHeader title={t("settings.myQRCode", { defaultValue: "My QR Code" })} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
          <TText dim>No username found. Please set up your profile first.</TText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={t("settings.myQRCode", { defaultValue: "My QR Code" })} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          alignItems: "center",
        }}
      >
        <Card style={{ padding: spacing.xl, width: "100%", alignItems: "center" }}>
          <TText weight="bold" size="lg" style={{ marginBottom: spacing.sm, textAlign: "center" }}>
            {t("settings.shareQRCode", { defaultValue: "Share Your QR Code" })}
          </TText>
          <TText dim size="sm" style={{ marginBottom: spacing.lg, textAlign: "center" }}>
            {t("settings.qrCodeDescription", { 
              defaultValue: "Others can scan this QR code to add you to trips" 
            })}
          </TText>

          {/* QR Code */}
          <View
            style={{
              width: QR_SIZE,
              height: QR_SIZE,
              backgroundColor: "#fff",
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <QRCode
              value={qrData}
              size={QR_SIZE - spacing.md * 2}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>

          {/* Username Display */}
          <View
            style={{
              backgroundColor: colors.bg.layer3,
              borderRadius: radii.sm,
              padding: spacing.md,
              width: "100%",
              marginBottom: spacing.lg,
              alignItems: "center",
            }}
          >
            <TText dim size="sm" style={{ marginBottom: spacing.xs }}>
              {t("settings.username", { defaultValue: "Username" })}
            </TText>
            <TText weight="bold" size="md">
              @{username}
            </TText>
          </View>

          {/* Action Buttons */}
          <View style={{ width: "100%", gap: spacing.md }}>
            <Pressable
              onPress={handleCopy}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.bg.layer2,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                gap: spacing.sm,
              }}
            >
              <Ionicons name="copy-outline" size={20} color={colors.text.primary} />
              <TText weight="medium">
                {t("settings.copyUsername", { defaultValue: "Copy Username" })}
              </TText>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent.primary,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                gap: spacing.sm,
              }}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <TText weight="bold" style={{ color: "#fff" }}>
                {t("settings.share", { defaultValue: "Share" })}
              </TText>
            </Pressable>
          </View>
        </Card>

        <Card inset style={{ marginTop: spacing.md, width: "100%" }}>
          <TText dim size="sm" style={{ textAlign: "center" }}>
            {t("settings.qrCodeInfo", {
              defaultValue: "When someone scans your QR code, they can add you as a collaborator or viewer to their trips."
            })}
          </TText>
        </Card>
      </ScrollView>
    </Screen>
  );
}
