import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import StatusPill from "../../src/components/StatusPill";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import { getTripById, addCollaboratorToTrip, addViewerToTrip } from "../../src/services/tripApi";
import { auth } from "../../src/services/firebase";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function JoinTripScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // QR data format: { tripId: number, role: "collaborator" | "viewer" }
  const [tripId, setTripId] = useState(params.tripId ? Number(params.tripId) : null);
  const [role, setRole] = useState(params.role || "viewer"); // "collaborator" or "viewer"
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (tripId && currentUserId) {
      loadTrip();
    }
  }, [tripId, currentUserId]);

  const loadTrip = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      const tripData = await getTripById(tripId);
      setTrip(tripData);
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to load trip details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!tripId || !currentUserId) return;

    setJoining(true);
    try {
      if (role === "collaborator") {
        await addCollaboratorToTrip(tripId, currentUserId);
      } else {
        await addViewerToTrip(tripId, currentUserId);
      }
      
      Alert.alert(
        "Success",
        `You have successfully joined this trip as a ${role}!`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace(`/trips/${tripId}`);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to join trip");
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Join Trip" />
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Card style={{ padding: 0 }}>
            <SkeletonRect height={200} radius={12} />
            <View style={{ padding: spacing.lg }}>
              <SkeletonText lines={2} />
              <SkeletonText lines={1} />
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen>
        <AppHeader title="Join Trip" />
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Card>
            <TText weight="bold">Trip not found</TText>
            <TText dim style={{ marginTop: spacing.sm }}>
              The trip you're trying to join doesn't exist or is no longer available.
            </TText>
            <View style={{ marginTop: spacing.lg }}>
              <Button title="Go Back" onPress={handleCancel} />
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  const visibility = trip.visibility || "PRIVATE";
  const isPublic = visibility === "PUBLIC";

  return (
    <Screen>
      <AppHeader title="Join Trip" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Trip Details Card */}
        <Card style={{ padding: 0 }}>
          {trip.coverPhotoUrl ? (
            <Image
              source={{ uri: trip.coverPhotoUrl }}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require("../../assets/cover-default.jpg")}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
            />
          )}
          <View style={{ padding: spacing.lg }}>
            <TText weight="bold" size="lg">
              {trip.title || "Untitled Trip"}
            </TText>
            {trip.description && (
              <TText dim style={{ marginTop: spacing.sm }}>
                {trip.description}
              </TText>
            )}
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md, flexWrap: "wrap" }}>
              <StatusPill
                type={isPublic ? "info" : "warning"}
                label={isPublic ? "PUBLIC" : "PRIVATE"}
              />
              <StatusPill
                type={role === "collaborator" ? "success" : "info"}
                label={role === "collaborator" ? "Collaborator" : "Viewer"}
              />
            </View>
          </View>
        </Card>

        {/* Role Information */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <Ionicons
              name={role === "collaborator" ? "people" : "eye"}
              size={20}
              color={colors.accent.primary}
              style={{ marginRight: spacing.sm }}
            />
            <TText weight="bold">
              {role === "collaborator" ? "Collaborator Access" : "Viewer Access"}
            </TText>
          </View>
          <TText dim size="sm">
            {role === "collaborator"
              ? "As a collaborator, you can edit trip content, organize moments, and upload new media."
              : "As a viewer, you can view the trip and its content but cannot make changes."}
          </TText>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: spacing.md }}>
          <Button
            title={role === "collaborator" ? "Join as Collaborator" : "Join as Viewer"}
            onPress={handleJoin}
            loading={joining}
          />
          <Button title="Cancel" variant="outline" onPress={handleCancel} />
        </View>
      </ScrollView>
    </Screen>
  );
}

