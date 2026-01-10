import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ScrollView, View, Pressable, RefreshControl } from "react-native";
import Screen from "../../../src/components/Screen";
import AppHeader from "../../../src/components/AppHeader";
import SearchBar from "../../../src/components/SearchBar";
import FilterBar from "../../../src/components/FilterBar";
import SectionHeader from "../../../src/components/SectionHeader";
import TripCard from "../../../src/components/trips/TripCard";
import FloatingActionButton from "../../../src/components/FloatingActionButton";
import TripActionsBottomSheet from "../../../src/components/trips/TripActionsBottomSheet";
import Card from "../../../src/components/Card";
import TText from "../../../src/components/TText";
import { useTheme } from "../../../src/theme";
import { spacing } from "../../../src/theme/spacing";
import { router } from "expo-router";
import { getAllTrips, searchTripsByTitle } from "../../../src/services/tripApi";
import { auth } from "../../../src/services/firebase";
import SkeletonRect from "../../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../../src/components/skeleton/SkeletonText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const ROLE_FILTERS = [
  { key: "all", label: "All Trips" },
  { key: "my", label: "My Trips" },
  { key: "following", label: "Following" },
];

const VISIBILITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "PUBLIC", label: "Public" },
  { key: "PRIVATE", label: "Private" },
];

export default function TripsList() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  
  const debounceTimer = useRef(null);
  const mounted = useRef(true);
  const requestToken = useRef(0);

  // Get current user ID
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && mounted.current) {
        setCurrentUserId(user.uid);
      }
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  // Fetch trips function (reusable for both initial load and refresh)
  const fetchTrips = useCallback(async (isRefresh = false) => {
    if (!currentUserId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    const token = ++requestToken.current;

    try {
      let fetchedTrips = [];

      if (searchQuery.trim()) {
        // Use search endpoint
        fetchedTrips = await searchTripsByTitle(searchQuery.trim(), 0, 100);
      } else {
        // Use getAllTrips
        fetchedTrips = await getAllTrips(0, 100);
      }

      if (!mounted.current || token !== requestToken.current) return;

      setTrips(fetchedTrips || []);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      if (!mounted.current || token !== requestToken.current) return;
      setError(err?.message || "Failed to load trips");
      setTrips([]);
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId, searchQuery]);

  // Initial fetch with debounced search
  useEffect(() => {
    if (!currentUserId) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchTrips(false);
    }, searchQuery.trim() ? 300 : 0); // Debounce only for search

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, currentUserId, fetchTrips]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    fetchTrips(true);
  }, [fetchTrips]);

  // Filter and categorize trips
  const { collaboratorTrips, viewerTrips } = useMemo(() => {
    if (!trips || trips.length === 0) {
      return { collaboratorTrips: [], viewerTrips: [] };
    }

    let filtered = [...trips];

    // Apply role filter
    if (activeFilter === "my") {
      // My trips = trips where user is owner OR collaborator
      filtered = filtered.filter(
        (t) => t.ownerId === currentUserId || 
        (Array.isArray(t.collaborators) && t.collaborators.includes(currentUserId))
      );
    } else if (activeFilter === "following") {
      // Following = trips where user is viewer (not owner or collaborator)
      filtered = filtered.filter(
        (t) =>
          Array.isArray(t.viewers) &&
          t.viewers.includes(currentUserId) &&
          t.ownerId !== currentUserId &&
          (!Array.isArray(t.collaborators) || !t.collaborators.includes(currentUserId))
      );
    }

    // Apply visibility filter
    if (visibilityFilter !== "all") {
      filtered = filtered.filter((t) => t.visibility === visibilityFilter);
    }

    // Categorize trips
    const collaborator = [];
    const viewer = [];

    filtered.forEach((trip) => {
      const isOwner = trip.ownerId === currentUserId;
      const isCollaborator =
        Array.isArray(trip.collaborators) && trip.collaborators.includes(currentUserId);

      if (isOwner || isCollaborator) {
        collaborator.push(trip);
      } else {
        viewer.push(trip);
      }
    });

    return { collaboratorTrips: collaborator, viewerTrips: viewer };
  }, [trips, activeFilter, visibilityFilter, currentUserId]);

  const handleTripPress = (tripId) => {
    router.push(`/trips/${tripId}`);
  };

  const handleFABPress = () => {
    setShowActionsSheet(true);
  };

  const handleCreateTrip = () => {
    router.push("/trips/create");
  };

  const handleShowMyQR = () => {
    router.push("/settings/my-qr-code");
  };

  return (
    <Screen>
      <AppHeader title="Your Trips" />
      
      {/* Sticky Search Bar */}
      <View
        style={{
          backgroundColor: colors.bg.layer1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search trips by title..."
          onClear={() => setSearchQuery("")}
          onFilterPress={() => setShowFilters(!showFilters)}
          showFilterButton={true}
        />

        {/* Collapsible Filters */}
        {showFilters && (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <FilterBar
              filters={ROLE_FILTERS}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <FilterBar
              filters={VISIBILITY_FILTERS}
              activeFilter={visibilityFilter}
              onFilterChange={setVisibilityFilter}
            />
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: insets.bottom + tabBarHeight + spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* Error state */}
        {error && (
          <Card inset>
            <TText weight="bold" style={{ color: colors.danger || "#c33" }}>
              Error
            </TText>
            <TText dim style={{ marginTop: spacing.sm }}>
              {String(error)}
            </TText>
          </Card>
        )}

        {/* Loading state (only show skeleton on initial load, not on refresh) */}
        {loading && !refreshing && (
          <View style={{ gap: spacing.lg }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`} style={{ padding: 0 }}>
                <SkeletonRect height={100} radius={12} />
                <View style={{ padding: spacing.md }}>
                  <SkeletonText lines={1} />
                  <SkeletonText lines={1} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Collaborator Trips Section */}
        {(!loading || refreshing) && collaboratorTrips.length > 0 && (
          <View style={{ gap: spacing.md }}>
            <SectionHeader
              title="Collaborator Trips"
              subtitle="Trips you own or can edit"
            />
            <View style={{ gap: spacing.md }}>
              {collaboratorTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} onPress={handleTripPress} />
              ))}
            </View>
          </View>
        )}

        {/* Viewer Trips Section */}
        {(!loading || refreshing) && viewerTrips.length > 0 && (
          <View style={{ gap: spacing.md }}>
            <SectionHeader
              title="Viewer Trips"
              subtitle="Trips you can view but not edit"
            />
            <View style={{ gap: spacing.md }}>
              {viewerTrips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} onPress={handleTripPress} />
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!loading && !refreshing && !error && collaboratorTrips.length === 0 && viewerTrips.length === 0 && (
          <Card inset>
            <TText dim style={{ textAlign: "center" }}>
              {searchQuery.trim()
                ? "No trips found matching your search."
                : "No trips found. Create your first trip to get started!"}
            </TText>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton icon="add" onPress={handleFABPress} />

      {/* Trip Actions Bottom Sheet */}
      <TripActionsBottomSheet
        visible={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onCreateTrip={handleCreateTrip}
        onJoinByQR={handleShowMyQR}
      />
    </Screen>
  );
}
