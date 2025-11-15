import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, ActivityIndicator, FlatList, Pressable, TextInput } from "react-native";
import TText from "../TText";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../../theme";
import { fetchTripActivity } from "../../data/trips";
import Ionicons from "@expo/vector-icons/Ionicons";
import Card from "../Card";
import BottomSheet from "../BottomSheet";

const ACTIVITY_TYPES = [
  { key: "all", label: "All Types", icon: "apps-outline" },
  { key: "UPLOAD", label: "Upload", icon: "cloud-upload-outline" },
  { key: "ARRANGE", label: "Arrange", icon: "reorder-three-outline" },
  { key: "DELETE_MEDIA", label: "Delete Media", icon: "trash-outline" },
  { key: "DELETE_MOMENT", label: "Delete Moment", icon: "trash-outline" },
  { key: "CHANGE_TRIP_INFO", label: "Trip Info", icon: "create-outline" },
  { key: "INVITED_PERSON", label: "Invited", icon: "person-add-outline" },
  { key: "NEW_COLLABORATOR", label: "Collaborator", icon: "people-outline" },
  { key: "NEW_VIEWER", label: "Viewer", icon: "eye-outline" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest", icon: "arrow-down" },
  { key: "oldest", label: "Oldest", icon: "arrow-up" },
];

const getActivityIcon = (type) => {
  switch (type) {
    case "UPLOAD": return "cloud-upload-outline";
    case "ARRANGE": return "reorder-three-outline";
    case "DELETE_MEDIA": return "trash-outline";
    case "DELETE_MOMENT": return "trash-outline";
    case "CHANGE_TRIP_INFO": return "create-outline";
    case "INVITED_PERSON": return "person-add-outline";
    case "NEW_COLLABORATOR": return "people-outline";
    case "NEW_VIEWER": return "eye-outline";
    default: return "information-circle-outline";
  }
};

const getActivityColor = (type, colors) => {
  switch (type) {
    case "DELETE_MEDIA":
    case "DELETE_MOMENT":
      return colors.status?.danger || "#d9534f";
    case "UPLOAD":
    case "NEW_COLLABORATOR":
    case "NEW_VIEWER":
      return colors.status?.success || "#2CA56A";
    case "CHANGE_TRIP_INFO":
      return colors.status?.warning || "#E8A638";
    default:
      return colors.status?.info || colors.text.muted;
  }
};

function ActivityRow({ item, colors }) {
  const icon = getActivityIcon(item.type);
  const tint = getActivityColor(item.type, colors);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card style={{ padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tint + "22",
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <TText weight="medium" style={{ marginBottom: spacing.xs }}>
            {item.text}
          </TText>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
            {item.user && (
              <TText size="sm" dim style={{ marginRight: spacing.sm }}>
                {item.user.displayName || item.user.username}
              </TText>
            )}
            <TText size="sm" dim>
              {formatTime(item.time)}
            </TText>
          </View>
        </View>
      </View>
    </Card>
  );
}

function FilterIconButton({ icon, isActive, hasFilter, onPress, colors, badge }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isActive ? colors.accent.primary + "22" : colors.bg.layer2,
        borderWidth: 1,
        borderColor: isActive ? colors.accent.primary : colors.border,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isActive ? colors.accent.primary : colors.text.primary}
      />
      {hasFilter && !isActive && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent.primary,
          }}
        />
      )}
      {badge && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.accent.primary,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.bg.layer1,
          }}
        >
          <TText size="xs" weight="bold" style={{ color: "#fff", fontSize: 10 }}>
            {badge}
          </TText>
        </View>
      )}
    </Pressable>
  );
}

export default function TripActivity({ tripId, enabled }) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateSearch, setDateSearch] = useState("");
  
  // Bottom sheet states
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);

  const load = useCallback(async (p) => {
    const res = await fetchTripActivity(tripId, { page: p, pageSize: 20 });
    setItems(prev => p===0 ? res.items : [...prev, ...res.items]);
    setHasMore(res.hasMore);
    setLoading(false);
    setLoadingMore(false);
  }, [tripId]);

  useEffect(() => {
    if (enabled) {
      setLoading(true);
      setPage(0);
      load(0);
    }
  }, [enabled, load]);

  // Get unique users from activities
  const availableUsers = useMemo(() => {
    const userMap = new Map();
    items.forEach(item => {
      if (item.user && item.user.id) {
        userMap.set(item.user.id, item.user);
      }
    });
    return Array.from(userMap.values());
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Filter by activity type
    if (activityTypeFilter !== "all") {
      filtered = filtered.filter(item => item.type === activityTypeFilter);
    }

    // Filter by user
    if (userFilter !== "all") {
      filtered = filtered.filter(item => item.user?.id === userFilter);
    }

    // Filter by date (simple string search in date string)
    if (dateSearch.trim()) {
      const searchLower = dateSearch.toLowerCase();
      filtered = filtered.filter(item => {
        const dateStr = new Date(item.time).toLocaleDateString().toLowerCase();
        return dateStr.includes(searchLower);
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.time - a.time);
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.time - b.time);
    }

    return filtered;
  }, [items, activityTypeFilter, userFilter, dateSearch, sortBy]);

  const selectedType = ACTIVITY_TYPES.find(t => t.key === activityTypeFilter);
  const selectedUser = availableUsers.find(u => u.id === userFilter);
  const hasActiveFilters = activityTypeFilter !== "all" || userFilter !== "all" || dateSearch.trim().length > 0;

  if (!enabled) return null;
  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Compact Filter Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          backgroundColor: colors.bg.layer1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* Activity Type Filter */}
          <FilterIconButton
            icon={selectedType?.icon || "apps-outline"}
            isActive={showTypeSheet}
            hasFilter={activityTypeFilter !== "all"}
            onPress={() => setShowTypeSheet(true)}
            colors={colors}
          />

          {/* User Filter */}
          {availableUsers.length > 0 && (
            <View style={{ marginLeft: spacing.sm }}>
              <FilterIconButton
                icon="person-outline"
                isActive={showUserSheet}
                hasFilter={userFilter !== "all"}
                onPress={() => setShowUserSheet(true)}
                colors={colors}
              />
            </View>
          )}

          {/* Date Search */}
          <View style={{ marginLeft: spacing.sm }}>
            <FilterIconButton
              icon="calendar-outline"
              isActive={showDateInput}
              hasFilter={dateSearch.trim().length > 0}
              onPress={() => setShowDateInput(true)}
              colors={colors}
            />
          </View>

          {/* Sort Toggle */}
          <Pressable
            onPress={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            style={{
              marginLeft: spacing.sm,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.bg.layer2,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={sortBy === "newest" ? "arrow-down" : "arrow-up"}
              size={20}
              color={colors.text.primary}
            />
          </Pressable>
        </View>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Pressable
            onPress={() => {
              setActivityTypeFilter("all");
              setUserFilter("all");
              setDateSearch("");
            }}
            style={{
              marginLeft: spacing.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }}
          >
            <TText size="sm" style={{ color: colors.accent.primary }}>
              Clear
            </TText>
          </Pressable>
        )}
      </View>

      {/* Date Input (shown inline when active) */}
      {showDateInput && (
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.sm,
            backgroundColor: colors.bg.layer1,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              value={dateSearch}
              onChangeText={setDateSearch}
              placeholder="Search by date (e.g., 12/25/2024)"
              placeholderTextColor={colors.text.muted}
              autoFocus
              style={{
                flex: 1,
                backgroundColor: colors.bg.layer2,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                color: colors.text.primary,
                marginRight: spacing.sm,
              }}
            />
            <Pressable
              onPress={() => {
                setShowDateInput(false);
                if (!dateSearch.trim()) setDateSearch("");
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.bg.layer2,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={18} color={colors.text.primary} />
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={filteredAndSortedItems}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}
        renderItem={({ item }) => <ActivityRow item={item} colors={colors} />}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (loadingMore || !hasMore) return;
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          load(next);
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: spacing.md }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <Card inset>
            <TText dim style={{ textAlign: "center" }}>
              No activity found.
            </TText>
          </Card>
        )}
      />

      {/* Activity Type Selection Sheet */}
      <BottomSheet visible={showTypeSheet} onClose={() => setShowTypeSheet(false)} maxHeight="60%">
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
            <TText weight="bold" size="lg">
              Filter by Activity Type
            </TText>
          </View>
          <FlatList
            data={ACTIVITY_TYPES}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
            renderItem={({ item: type }) => {
              const isSelected = activityTypeFilter === type.key;
              return (
                <Pressable
                  onPress={() => {
                    setActivityTypeFilter(type.key);
                    setShowTypeSheet(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: spacing.md,
                    backgroundColor: isSelected ? colors.accent.primary + "22" : colors.bg.layer2,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent.primary : colors.border,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isSelected ? colors.accent.primary : colors.bg.layer3,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: spacing.md,
                    }}
                  >
                    <Ionicons
                      name={type.icon}
                      size={18}
                      color={isSelected ? "#fff" : colors.text.primary}
                    />
                  </View>
                  <TText weight={isSelected ? "bold" : "regular"} style={{ flex: 1 }}>
                    {type.label}
                  </TText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheet>

      {/* User Selection Sheet */}
      <BottomSheet visible={showUserSheet} onClose={() => setShowUserSheet(false)} maxHeight="60%">
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
            <TText weight="bold" size="lg">
              Filter by User
            </TText>
          </View>
          <FlatList
            data={[{ id: "all", displayName: "All Users", isAll: true }, ...availableUsers]}
            keyExtractor={(item) => item.isAll ? "all" : item.id}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
            renderItem={({ item: user }) => {
              const isAll = user.isAll;
              const isSelected = isAll ? userFilter === "all" : userFilter === user.id;
              return (
                <Pressable
                  onPress={() => {
                    setUserFilter(isAll ? "all" : user.id);
                    setShowUserSheet(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: spacing.md,
                    backgroundColor: isSelected ? colors.accent.primary + "22" : colors.bg.layer2,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent.primary : colors.border,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isSelected ? colors.accent.primary : colors.bg.layer3,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: spacing.md,
                    }}
                  >
                    <Ionicons
                      name={isAll ? "people-outline" : "person"}
                      size={18}
                      color={isSelected ? "#fff" : colors.text.primary}
                    />
                  </View>
                  <TText weight={isSelected ? "bold" : "regular"} style={{ flex: 1 }}>
                    {user.displayName || user.username}
                  </TText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
