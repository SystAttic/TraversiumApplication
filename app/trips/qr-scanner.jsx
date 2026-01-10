import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import TText from "../../src/components/TText";
import ModalConfirm from "../../src/components/ModalConfirm";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getUser } from "../../src/services/userApi";
import { addCollaboratorToTrip, addViewerToTrip } from "../../src/services/tripApi";

export default function QRScannerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedUsername, setScannedUsername] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [adding, setAdding] = useState(false);
  
  const tripId = params.tripId ? Number(params.tripId) : null;
  const role = params.role || "collaborator";

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera permissions in your device settings to scan QR codes.",
        [
          { text: "Cancel", onPress: () => router.back(), style: "cancel" },
          { text: "OK", onPress: () => router.back() },
        ]
      );
    }
  }, [permission]);

  // QR Code format: username string
  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || !data) return; // Prevent multiple scans
    
    setScanned(true);
    const username = data.trim();
    
    if (!username) {
      Alert.alert(
        "Invalid QR Code",
        "Could not read username from QR code.",
        [
          { text: "OK", onPress: () => setScanned(false) },
        ]
      );
      return;
    }

    try {
      // Get user info to show in confirmation
      const user = await getUser({ username });
      if (!user || !user.firebaseId) {
        Alert.alert(
          "User Not Found",
          `User with username "${username}" not found.`,
          [
            { text: "OK", onPress: () => setScanned(false) },
          ]
        );
        return;
      }

      setScannedUsername(username);
      setUserInfo(user);
      setShowConfirm(true);
    } catch (error) {
      console.error("Failed to get user:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to find user. Please try again.",
        [
          { text: "OK", onPress: () => setScanned(false) },
        ]
      );
    }
  };

  const handleConfirmAdd = async () => {
    if (!tripId || !userInfo || !userInfo.firebaseId) {
      Alert.alert("Error", "Missing information");
      return;
    }

    setAdding(true);
    try {
      if (role === "collaborator") {
        await addCollaboratorToTrip(tripId, userInfo.firebaseId);
      } else {
        await addViewerToTrip(tripId, userInfo.firebaseId);
      }

      Alert.alert(
        "Success",
        `${userInfo.displayName || userInfo.username} has been added as a ${role}`,
        [
          { text: "OK", onPress: () => router.back() },
        ]
      );
    } catch (error) {
      console.error("Failed to add user:", error);
      Alert.alert("Error", error?.message || "Failed to add user. Please try again.");
      setAdding(false);
      setShowConfirm(false);
      setScanned(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!permission) {
    // Permission is still being requested
    return (
      <Screen>
        <AppHeader
          title="Scan QR Code"
          showBell={false}
          rightElement={
            <Pressable onPress={handleGoBack} hitSlop={10}>
              <TText style={{ color: colors.accent.primary }}>Go back</TText>
            </Pressable>
          }
        />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <TText dim style={{ marginTop: spacing.md }}>
            Requesting camera permission...
          </TText>
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <AppHeader
          title="Scan QR Code"
          showBell={false}
          rightElement={
            <Pressable onPress={handleGoBack} hitSlop={10}>
              <TText style={{ color: colors.accent.primary }}>Go back</TText>
            </Pressable>
          }
        />
        <View style={[styles.container, { padding: spacing.xl }]}>
          <Ionicons name="camera-outline" size={64} color={colors.text.muted} />
          <TText weight="bold" size="lg" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            Camera Permission Required
          </TText>
          <TText dim style={{ textAlign: "center", marginBottom: spacing.xl }}>
            We need access to your camera to scan QR codes. Please grant camera permissions to continue.
          </TText>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: colors.accent.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: 8,
            }}
          >
            <TText weight="bold" style={{ color: "#fff" }}>
              Grant Permission
            </TText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title="Scan QR Code"
        showBell={false}
        rightElement={
          <Pressable onPress={handleGoBack} hitSlop={10}>
            <TText style={{ color: colors.accent.primary }}>Go back</TText>
          </Pressable>
        }
      />
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Overlay with scanning frame */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <TText
            weight="bold"
            style={{
              color: "#fff",
              marginTop: spacing.xl,
              textAlign: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 8,
            }}
          >
            Point your camera at a user's QR code
          </TText>
        </View>

        {scanned && (
          <View style={styles.scanAgainContainer}>
            <Pressable
              onPress={() => setScanned(false)}
              style={{
                backgroundColor: colors.accent.primary,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: 8,
              }}
            >
              <TText weight="bold" style={{ color: "#fff" }}>
                Tap to Scan Again
              </TText>
            </Pressable>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      <ModalConfirm
        visible={showConfirm}
        title={`Add as ${role === "collaborator" ? "Collaborator" : "Viewer"}?`}
        message={`You are about to add @${scannedUsername} (${userInfo?.displayName || scannedUsername}) as ${role === "collaborator" ? "a collaborator" : "a viewer"}. Are you sure you want to do this?`}
        confirmText={adding ? "Adding..." : "Yes, Add"}
        cancelText="Cancel"
        onConfirm={handleConfirmAdd}
        onCancel={() => {
          setShowConfirm(false);
          setScannedUsername(null);
          setUserInfo(null);
          setScanned(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanAgainContainer: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: "center",
  },
});
