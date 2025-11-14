import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ScrollView, View, TextInput, Pressable, Image, RefreshControl } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import { Link } from "expo-router";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { fetchMe } from "../../src/data/api";
import { searchTripsByTitle, getAllTrips, getTripsByViewer } from "../../src/services/tripApi";
import { searchUsersByUsername } from "../../src/services/userApi";
import { auth } from "../../src/services/firebase";
import TripCard from "../../src/components/trips/TripCard";
import UserRow from "../../src/components/users/UserRow";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

const PAGE_SIZE = 20;

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 0;

  const [searchType, setSearchType] = useState("trips"); // "trips" or "users"
  const [tripFilter, setTripFilter] = useState("mine"); // "mine" or "public"
  const [q, setQ] = useState("");
  const [me, setMe] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const debTimer = useRef(null);
  const reqToken = useRef(0);
  const mounted = useRef(true);

  // Get current user and Firebase ID
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const u = await fetchMe();
        if (!mounted.current) return;
        setMe(u);
      } catch {
        // non-fatal
      }
    })();

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

  // Search function with pagination
  const performSearch = useCallback(async (searchOffset = 0, isRefresh = false) => {
    if (!currentUserId && searchType === "trips" && tripFilter === "mine") return;

    if (isRefresh) {
      setRefreshing(true);
    } else if (q.trim() || searchOffset > 0) {
      // Only show loading if there's a query or we're loading more
      setLoading(true);
    }
    setError(null);
    const token = ++reqToken.current;

    try {
      if (searchType === "users") {
        // User search
        if (!q.trim()) {
          if (!mounted.current || token !== reqToken.current) return;
          setResults([]);
          setHasMore(false);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const fetchedUsers = await searchUsersByUsername(q.trim(), searchOffset, PAGE_SIZE);

        if (!mounted.current || token !== reqToken.current) return;

        if (isRefresh) {
          setResults(fetchedUsers || []);
          setOffset(fetchedUsers?.length || 0);
        } else {
          setResults((prev) => (searchOffset === 0 ? fetchedUsers || [] : [...prev, ...(fetchedUsers || [])]));
          setOffset((prev) => prev + (fetchedUsers?.length || 0));
        }

        setHasMore((fetchedUsers?.length || 0) === PAGE_SIZE);
        setLoading(false);
        setRefreshing(false);
      } else {
        // Trip search
        let fetchedTrips = [];

        if (q.trim()) {
          fetchedTrips = await searchTripsByTitle(q.trim(), searchOffset, PAGE_SIZE);
        } else {
          if (tripFilter === "mine") {
            fetchedTrips = await getTripsByViewer(searchOffset, PAGE_SIZE);
          } else {
            const all = await getAllTrips(searchOffset, PAGE_SIZE);
            fetchedTrips = all.filter((t) => t.visibility === "PUBLIC");
          }
        }

        if (!mounted.current || token !== reqToken.current) return;

        // Filter based on trip filter
        if (!q.trim() && tripFilter === "mine" && currentUserId) {
          fetchedTrips = fetchedTrips.filter(
            (t) =>
              t.ownerId === currentUserId ||
              (Array.isArray(t.collaborators) && t.collaborators.includes(currentUserId))
          );
        }

        if (isRefresh) {
          setResults(fetchedTrips || []);
          setOffset(fetchedTrips?.length || 0);
        } else {
          setResults((prev) => (searchOffset === 0 ? fetchedTrips || [] : [...prev, ...(fetchedTrips || [])]));
          setOffset((prev) => prev + (fetchedTrips?.length || 0));
        }

        setHasMore((fetchedTrips?.length || 0) === PAGE_SIZE);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (e) {
      if (!mounted.current || token !== reqToken.current) return;
      setError(e?.message || "Something went wrong.");
      setResults([]);
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, searchType, tripFilter, currentUserId]);

  // Debounced search when query or filter changes
  useEffect(() => {
    if (debTimer.current) clearTimeout(debTimer.current);

    setResults([]);
    setOffset(0);
    setHasMore(true);
    setError(null);

    if (!currentUserId && searchType === "trips" && tripFilter === "mine") {
      setLoading(false);
      return;
    }

    // If no query, show empty state immediately without loading
    if (!q.trim()) {
      setLoading(false);
      return;
    }

    // Only show loading if there's a query
    setLoading(true);
    const token = ++reqToken.current;

    debTimer.current = setTimeout(() => {
      performSearch(0, false);
    }, 300);

    return () => {
      if (debTimer.current) clearTimeout(debTimer.current);
    };
  }, [q, searchType, tripFilter, currentUserId, performSearch]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore && results.length > 0) {
      performSearch(offset, false);
    }
  }, [loading, refreshing, hasMore, offset, results.length, performSearch]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    performSearch(0, true);
  }, [performSearch]);

  const placeholder = useMemo(() => {
    if (searchType === "users") return "Search users by username...";
    if (tripFilter === "mine") return "Search your trips...";
    return "Search public trips...";
  }, [searchType, tripFilter]);

  return (
    <Screen>
      <AppHeader title="Search" />

      {/* Search Type Tabs */}
      <View
        style={{
          backgroundColor: colors.bg.layer1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.bg.layer2,
            borderRadius: radii.lg,
            padding: 4,
            marginBottom: spacing.md,
          }}
        >
          <Pressable
            onPress={() => {
              setSearchType("trips");
              setResults([]);
            }}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              alignItems: "center",
              borderRadius: radii.md,
              backgroundColor: searchType === "trips" ? colors.accent.primary : "transparent",
            }}
          >
            <TText
              weight="medium"
              size="sm"
              style={{ color: searchType === "trips" ? "#fff" : colors.text.primary }}
            >
              Trips
            </TText>
          </Pressable>
          <Pressable
            onPress={() => {
              setSearchType("users");
              setResults([]);
            }}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              alignItems: "center",
              borderRadius: radii.md,
              backgroundColor: searchType === "users" ? colors.accent.primary : "transparent",
            }}
          >
            <TText
              weight="medium"
              size="sm"
              style={{ color: searchType === "users" ? "#fff" : colors.text.primary }}
            >
              Users
            </TText>
          </Pressable>
        </View>

        {/* Trip Filter (only show when searching trips) */}
        {searchType === "trips" && (
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <Pressable
              onPress={() => {
                setTripFilter("mine");
                setResults([]);
              }}
              style={{
                flex: 1,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                borderRadius: 999,
                backgroundColor: tripFilter === "mine" ? colors.accent.primary : colors.bg.layer2,
                borderWidth: 1,
                borderColor: tripFilter === "mine" ? colors.accent.primary : colors.border,
              }}
            >
              <TText
                weight="medium"
                size="sm"
                style={{ color: tripFilter === "mine" ? "#fff" : colors.text.primary }}
              >
                My Trips
              </TText>
            </Pressable>
            <Pressable
              onPress={() => {
                setTripFilter("public");
                setResults([]);
              }}
              style={{
                flex: 1,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                borderRadius: 999,
                backgroundColor: tripFilter === "public" ? colors.accent.primary : colors.bg.layer2,
                borderWidth: 1,
                borderColor: tripFilter === "public" ? colors.accent.primary : colors.border,
              }}
            >
              <TText
                weight="medium"
                size="sm"
                style={{ color: tripFilter === "public" ? "#fff" : colors.text.primary }}
              >
                Public Trips
              </TText>
            </Pressable>
          </View>
        )}

        {/* Search Input */}
        <View
          style={{
            backgroundColor: colors.bg.layer2,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.text.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted}
            style={{ flex: 1, color: colors.text.primary, paddingVertical: 6 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={20} color={colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: insets.bottom + tabBarHeight + spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
            hasMore &&
            !loading
          ) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Error state */}
        {error && (
          <Card inset>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger || "#c33"} />
              <TText weight="bold" style={{ color: colors.danger || "#c33" }}>
                Search error
              </TText>
            </View>
            <TText dim>{String(error)}</TText>
          </Card>
        )}

        {/* Results count */}
        {!loading && !refreshing && !error && results.length > 0 && (
          <TText dim size="sm">
            Found {results.length} {searchType === "users" ? (results.length === 1 ? "user" : "users") : (results.length === 1 ? "trip" : "trips")}
          </TText>
        )}

        {/* Loading skeleton */}
        {loading && !refreshing && (
          <View style={{ gap: spacing.md }}>
            {Array.from({ length: searchType === "users" ? 4 : 3 }).map((_, i) => (
              searchType === "users" ? (
                <Card key={`user-skel-${i}`}>
                  <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
                    <SkeletonRect height={56} radius={999} />
                    <View style={{ flex: 1 }}>
                      <SkeletonText lines={1} />
                      <SkeletonText lines={1} />
                    </View>
                  </View>
                </Card>
              ) : (
                <Card key={`trip-skel-${i}`} style={{ padding: 0 }}>
                  <SkeletonRect height={100} radius={12} />
                  <View style={{ padding: spacing.md }}>
                    <SkeletonText lines={1} />
                    <SkeletonText lines={1} />
                  </View>
                </Card>
              )
            ))}
          </View>
        )}

        {/* Trip results */}
        {!loading && !refreshing && searchType === "trips" && (
          <View style={{ gap: spacing.md }}>
            {results.map((trip) => (
              <TripCard key={trip.tripId} trip={trip} />
            ))}
          </View>
        )}

        {/* User results */}
        {!loading && !refreshing && searchType === "users" && (
          <View style={{ gap: spacing.md }}>
            {results.map((user) => (
              <Link key={user.username || user.userId} href={`/users/${encodeURIComponent(user.username)}`} asChild>
                <Pressable>
                  <UserRow user={user} rightKind="none" />
                </Pressable>
              </Link>
            ))}
          </View>
        )}

        {/* Load more indicator (trips only) */}
        {hasMore && results.length > 0 && !loading && searchType === "trips" && (
          <View style={{ alignItems: "center", padding: spacing.md }}>
            <TText dim size="sm">Scroll for more...</TText>
          </View>
        )}

        {/* Loading more indicator */}
        {loading && results.length > 0 && (
          <View style={{ alignItems: "center", padding: spacing.md }}>
            <TText dim size="sm">Loading more...</TText>
          </View>
        )}

        {/* Empty state - trips */}
        {!loading && !refreshing && !error && results.length === 0 && searchType === "trips" && q.trim() && (
          <Card inset>
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
                <Ionicons name="map-outline" size={32} color={colors.text.muted} />
              </View>
              <TText weight="bold" style={{ marginBottom: spacing.xs }}>
                No trips found
              </TText>
              <TText dim style={{ textAlign: "center" }}>
                Try adjusting your search or filter
              </TText>
            </View>
          </Card>
        )}

        {/* Empty state - users */}
        {!loading && !refreshing && !error && results.length === 0 && searchType === "users" && q.trim() && (
          <Card inset>
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
                <Ionicons name="people-outline" size={32} color={colors.text.muted} />
              </View>
              <TText weight="bold" style={{ marginBottom: spacing.xs }}>
                No users found
              </TText>
              <TText dim style={{ textAlign: "center" }}>
                Try a different username
              </TText>
            </View>
          </Card>
        )}

        {/* Initial empty state */}
        {!loading && !refreshing && !error && results.length === 0 && !q.trim() && (
          <Card inset>
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
                <Ionicons name="search-outline" size={32} color={colors.text.muted} />
              </View>
              <TText weight="bold" style={{ marginBottom: spacing.xs }}>
                Start searching
              </TText>
              <TText dim style={{ textAlign: "center", marginBottom: spacing.lg }}>
                {searchType === "users"
                  ? "Search for users by username"
                  : "Search for trips by title or browse by filter"}
              </TText>
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
