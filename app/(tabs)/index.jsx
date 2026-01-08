import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ScrollView, View, Pressable, RefreshControl } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import { Link, router } from "expo-router";
import { fetchTrips, fetchMe } from "../../src/data/api";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { getMediaFileUrl } from "../../src/services/fileStorageApi";
import AuthenticatedImage from "../../src/components/AuthenticatedImage";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 0;
  const [me, setMe] = useState(null);
  const [allTrips, setAllTrips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [u, trips] = await Promise.all([fetchMe(), fetchTrips()]);
      setMe(u);
      setAllTrips(trips);
      setError(null);
    } catch (err) {
      console.error("Error loading home data:", err);
      setError(err);
      // Don't clear existing data on error during refresh
      if (!isRefresh) {
        setMe(null);
        setAllTrips(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Filter user's trips (where they're owner or collaborator)
  const myTrips = useMemo(() => {
    if (!me || !allTrips) return [];
    return allTrips.filter((t) => {
      const collaborators = t.collaborators || [];
      const ownerId = t.ownerId;
      return collaborators.includes(me.firebaseId) || ownerId === me.firebaseId;
    });
  }, [me, allTrips]);

  // Get a random featured trip
  const featuredTrip = useMemo(() => {
    if (!myTrips || myTrips.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * myTrips.length);
    return myTrips[randomIndex];
  }, [myTrips]);

  // Calculate stats
  const stats = useMemo(() => {
    const trips = myTrips?.length || 0;
    const moments = (myTrips || []).reduce((sum, t) => {
      const albums = t.albums || [];
      return sum + albums.reduce((albumSum, album) => albumSum + ((album.media || []).length), 0);
    }, 0);
    return { trips, moments };
  }, [myTrips]);

  const firstName = me?.displayName?.split(" ")[0] || me?.firstName || me?.username || "Traveler";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  // Show error state if there's an error and no data
  if (error && !me && !allTrips && !loading) {
    return (
      <Screen>
        <AppHeader title="Home" />
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.xl,
            paddingBottom: insets.bottom + tabBarHeight + spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
        >
          <Card>
            <View style={{ alignItems: "center", padding: spacing.xl }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  backgroundColor: colors.bg.layer2,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="cloud-offline-outline" size={32} color={colors.text.muted} />
              </View>
              <TText weight="bold" size="lg" style={{ marginBottom: spacing.xs, textAlign: "center" }}>
                Currently Unavailable
              </TText>
              <TText dim style={{ textAlign: "center", marginBottom: spacing.lg }}>
                Please check your internet connection and try again
              </TText>
              <Button title="Retry" onPress={() => loadData(false)} />
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Home" />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: insets.bottom + tabBarHeight + spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* Welcome Section */}
        <Card>
          {me ? (
            <>
              <TText weight="bold" size="xl" style={{ marginBottom: spacing.xs }}>
                {greeting}, {firstName}! 👋
              </TText>
              <TText dim style={{ marginBottom: spacing.lg }}>
                Ready to capture your next adventure?
              </TText>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Button 
                  title="New Trip" 
                  onPress={() => router.push("/trips/create")}
                  style={{ flex: 1 }}
                />
                <Link href="/trips" asChild>
                  <Button 
                    title="Browse" 
                    variant="ghost"
                    style={{ flex: 1 }}
                  />
                </Link>
              </View>
            </>
          ) : loading ? (
            <>
              <SkeletonText lines={1} />
              <SkeletonText lines={2} style={{ marginTop: spacing.md }} />
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
                <View style={{ flex: 1, height: 44, backgroundColor: colors.bg.layer2, borderRadius: radii.md }} />
                <View style={{ flex: 1, height: 44, backgroundColor: colors.bg.layer2, borderRadius: radii.md }} />
              </View>
            </>
          ) : null}
        </Card>

        {/* Stats Cards */}
        {me && (
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card inset style={{ flex: 1, alignItems: "center" }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 999, 
                backgroundColor: colors.accent.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.sm
              }}>
                <Ionicons name="map-outline" size={24} color={colors.accent.primary} />
              </View>
              <TText weight="bold" size="lg">{stats.trips}</TText>
              <TText dim size="sm">Trips</TText>
            </Card>
            <Card inset style={{ flex: 1, alignItems: "center" }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 999, 
                backgroundColor: colors.accent.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.sm
              }}>
                <Ionicons name="images-outline" size={24} color={colors.accent.primary} />
              </View>
              <TText weight="bold" size="lg">{stats.moments}</TText>
              <TText dim size="sm">Moments</TText>
            </Card>
          </View>
        )}

        {/* Featured Trip */}
        {featuredTrip ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TText weight="bold" size="lg">Remember this?</TText>
              <Link href="/trips" asChild>
                <Pressable>
                  <TText size="sm" style={{ color: colors.accent.primary }}>View all →</TText>
                </Pressable>
              </Link>
            </View>
            <Link key={featuredTrip.tripId} href={`/trips/${featuredTrip.tripId}`} asChild>
              <Pressable>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <AuthenticatedImage 
                    source={featuredTrip.coverPhotoUrl 
                      ? { uri: getMediaFileUrl(featuredTrip.coverPhotoUrl) } 
                      : require("../../assets/cover-default.jpg")
                    } 
                    style={{ width: "100%", height: 200 }} 
                    resizeMode="cover"
                  />
                  <View style={{ padding: spacing.lg }}>
                    <TText weight="bold" size="lg">{featuredTrip.title || "Untitled Trip"}</TText>
                    {featuredTrip.description ? (
                      <TText dim style={{ marginTop: spacing.xs }}>
                        {featuredTrip.description}
                      </TText>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md, alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="images-outline" size={16} color={colors.text.muted} />
                        <TText size="sm" dim>
                          {(featuredTrip.albums || []).reduce((sum, album) => sum + ((album.media || []).length), 0)} moments
                        </TText>
                      </View>
                      {(featuredTrip.collaborators || []).length > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="people-outline" size={16} color={colors.text.muted} />
                          <TText size="sm" dim>
                            {(featuredTrip.collaborators || []).length} {featuredTrip.collaborators.length === 1 ? "collaborator" : "collaborators"}
                          </TText>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            </Link>
          </View>
        ) : myTrips && myTrips.length === 0 && me ? (
          <Card>
            <View style={{ alignItems: "center", padding: spacing.xl }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 999, 
                backgroundColor: colors.bg.layer2,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.md
              }}>
                <Ionicons name="map-outline" size={32} color={colors.text.muted} />
              </View>
              <TText weight="bold" style={{ marginBottom: spacing.xs }}>Start your first trip</TText>
              <TText dim style={{ textAlign: "center", marginBottom: spacing.lg }}>
                Create a trip to start capturing and sharing your adventures
              </TText>
              <Button 
                title="Create Trip" 
                onPress={() => router.push("/trips/create")}
              />
            </View>
          </Card>
        ) : null}

        {/* Your Trips Section */}
        {myTrips && myTrips.length > 1 && (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TText weight="bold" size="lg">Your Trips</TText>
              <Link href="/trips" asChild>
                <Pressable>
                  <TText size="sm" style={{ color: colors.accent.primary }}>See all →</TText>
                </Pressable>
              </Link>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}
            >
              {myTrips
                .filter(t => t.tripId !== featuredTrip?.tripId)
                .slice(0, 3)
                .map((t) => (
                  <Link key={t.tripId} href={`/trips/${t.tripId}`} asChild>
                    <Pressable>
                      <View
                        style={{
                          width: 200,
                          backgroundColor: colors.bg.layer2,
                          borderRadius: radii.lg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          overflow: "hidden",
                        }}
                      >
                        <AuthenticatedImage 
                          source={t.coverPhotoUrl 
                            ? { uri: getMediaFileUrl(t.coverPhotoUrl) } 
                            : require("../../assets/cover-default.jpg")
                          } 
                          style={{ width: "100%", height: 120 }} 
                          resizeMode="cover"
                        />
                        <View style={{ padding: spacing.md }}>
                          <TText weight="bold" numberOfLines={1}>{t.title || "Untitled Trip"}</TText>
                          {t.description ? (
                            <TText dim size="sm" numberOfLines={1} style={{ marginTop: 4 }}>
                              {t.description}
                            </TText>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
