import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Screen from "../../../../src/components/Screen";
import AppHeader from "../../../../src/components/AppHeader";
import Card from "../../../../src/components/Card";
import TText from "../../../../src/components/TText";
import { useTheme } from "../../../../src/theme";
import { spacing, radii } from "../../../../src/theme/spacing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getTripById, autosortTrip } from "../../../../src/services/tripApi";
import ProgressBar from "../../../../src/components/ProgressBar";
import { LinearGradient } from "expo-linear-gradient";

export default function AutoArrangeScreen() {
  const { id: tripId } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tripIdNum = useMemo(() => {
    const finalId = Array.isArray(tripId) ? tripId[0] : tripId;
    return Number(finalId);
  }, [tripId]);

  const [step, setStep] = useState(1); // 1: confirmation, 2: processing, 3: success/error
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autosortedTrip, setAutosortedTrip] = useState(null);
  const [error, setError] = useState(null);

  // Load trip data
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const tripData = await getTripById(tripIdNum);
        if (!on) return;
        setTrip(tripData);
      } catch (error) {
        console.error("Failed to load trip:", error);
        Alert.alert("Error", "Failed to load trip data");
        router.back();
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [tripIdNum]);

  const handleConfirm = async () => {
    if (!trip) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setStep(2);

    let progressInterval = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Don't go to 100% until API call completes
          return prev + 5;
        });
      }, 500);

      // Call autosort API
      const sortedTrip = await autosortTrip(trip);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(100);

      // Small delay to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 300));

      setAutosortedTrip(sortedTrip);
      setStep(3);

      // Automatically navigate to review after showing success for 1 second
      setTimeout(() => {
        if (sortedTrip) {
          router.push({
            pathname: `/trips/${tripIdNum}/upload/auto-review`,
            params: {
              originalTrip: JSON.stringify(trip),
              autosortedTrip: JSON.stringify(sortedTrip),
            },
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Autosort failed:", error);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setError(
        error?.response?.data?.message || 
        error?.message || 
        "Failed to autosort trip. Please try again."
      );
      setStep(3);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleReview = () => {
    if (!autosortedTrip || !trip) return;

    // Navigate to review screen with autosorted trip data
    router.push({
      pathname: `/trips/${tripIdNum}/upload/auto-review`,
      params: {
        originalTrip: JSON.stringify(trip),
        autosortedTrip: JSON.stringify(autosortedTrip),
      },
    });
  };

  const handleDoLater = () => {
    router.replace(`/trips/${tripIdNum}`);
  };

  if (loading || !trip) {
    return (
      <Screen>
        <AppHeader title="Auto Moment Arrangement" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  const unorganizedCount = trip.albums?.find(a => a.albumId === trip.defaultAlbum)?.media?.length || 0;

  return (
    <Screen>
      <AppHeader title="Auto Moment Arrangement" showBell={false} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ padding: spacing.xl }}>
          {/* Step 1: Confirmation */}
          {step === 1 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Smart Sorting
                </TText>
                <TText dim size="sm">Let AI organize your photos automatically</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.status.info + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="sparkles" size={48} color={colors.status.info} />
                </View>

                <View style={{ gap: spacing.sm, alignItems: "center" }}>
                  <TText weight="semibold" style={{ fontSize: 18, textAlign: "center" }}>
                    Do you want to use our smart sorting?
                  </TText>
                  <TText dim style={{ textAlign: "center", lineHeight: 22 }}>
                    We'll automatically organize your {unorganizedCount} unorganized photo{unorganizedCount !== 1 ? "s" : ""} into moments based on location, time, and other metadata.
                  </TText>
                </View>

                <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
                  <Pressable
                    onPress={handleConfirm}
                    style={{ borderRadius: radii.md, overflow: "hidden" }}
                  >
                    <LinearGradient
                      colors={[colors.accent.primary, colors.accent.primary]}
                      style={{ padding: spacing.md, alignItems: "center" }}
                    >
                      <TText style={{ color: "#fff", fontWeight: "bold" }}>Yes, Sort Automatically</TText>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={handleCancel}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      alignItems: "center",
                    }}
                  >
                    <TText>No, Cancel</TText>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* Step 2: Processing */}
          {step === 2 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  Organizing your photos
                </TText>
                <TText dim size="sm">Please wait while we organize your media...</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <View style={{ width: "100%" }}>
                  <ProgressBar value={progress} max={100} />
                  <TText dim size="sm" style={{ textAlign: "center", marginTop: spacing.xs }}>
                    {Math.round(progress)}% complete
                  </TText>
                </View>
                <TText dim style={{ textAlign: "center" }}>
                  Analyzing photos and creating moments...
                </TText>
              </View>
            </>
          )}

          {/* Step 3: Success/Error */}
          {step === 3 && (
            <>
              <View style={{ gap: 6, marginBottom: spacing.sm }}>
                <TText weight="bold" style={{ fontSize: 20 }}>
                  {error ? "Sorting failed" : "Sorting complete!"}
                </TText>
                <TText dim size="sm">Step 3 of 3</TText>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.lg, alignItems: "center" }}>
                {error ? (
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
                      Sorry, the sorting did not go through.
                    </TText>
                    <TText dim style={{ textAlign: "center", marginTop: spacing.md }}>
                      {error}
                    </TText>

                    <View style={{ width: "100%", gap: spacing.md, marginTop: spacing.lg }}>
                      <Pressable
                        onPress={() => {
                          setStep(1);
                          setError(null);
                        }}
                        style={{ borderRadius: radii.md, overflow: "hidden" }}
                      >
                        <LinearGradient
                          colors={[colors.accent.primary, colors.accent.primary]}
                          style={{ padding: spacing.md, alignItems: "center" }}
                        >
                          <TText style={{ color: "#fff", fontWeight: "bold" }}>Try Again</TText>
                        </LinearGradient>
                      </Pressable>
                      <Pressable
                        onPress={handleCancel}
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
                ) : (
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
                      Your photos have been organized!
                    </TText>
                    <TText dim style={{ textAlign: "center", marginTop: spacing.md }}>
                      Opening review page...
                    </TText>
                  </>
                )}
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
