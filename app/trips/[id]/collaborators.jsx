import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, FlatList, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageMiniHeader from "../../../src/components/PageMiniHeader";
import { fetchTripById } from "../../../src/data/trips";
import TText from "../../../src/components/TText";
import Card from "../../../src/components/Card";
import UserRow from "../../../src/components/users/UserRow";
import SearchBar from "../../../src/components/SearchBar";
import { spacing } from "../../../src/theme/spacing";
import { useTheme } from "../../../src/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TRIP_BAR_BASE_HEIGHT } from "../../../src/components/trips/TripBottomBar";

export default function CollaboratorsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      const t = await fetchTripById(String(id || "t1"));
      if (!on) return;
      setTrip(t);
      setLoading(false);
    })();
    return () => { on = false; };
  }, [id]);

  const collaborators = Array.isArray(trip?.collaborators) ? trip.collaborators : [];
  const canEdit = !!trip?.isCollaborator || trip?.ownerId === trip?.currentUserId;

  const filteredCollaborators = useMemo(() => {
    if (!searchQuery.trim()) return collaborators;
    const query = searchQuery.toLowerCase();
    return collaborators.filter(user => {
      const name = (user.displayName || user.username || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      return name.includes(query) || username.includes(query);
    });
  }, [collaborators, searchQuery]);

  const handleRemove = (userId) => {
    Alert.alert(
      "Remove Collaborator",
      "Are you sure you want to remove this collaborator?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // TODO: Call API to remove collaborator
            Alert.alert("Success", "Collaborator removed successfully");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <PageMiniHeader
        bgUri={trip?.coverUri}
        title="Collaborators"
        subtitle={trip?.title || ""}
      />

      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.bg.layer1,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search collaborators..."
          onClear={() => setSearchQuery("")}
        />
      </View>

      <FlatList
        data={filteredCollaborators}
        keyExtractor={(item) => item.id || `collab-${item.username}`}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: TRIP_BAR_BASE_HEIGHT + insets.bottom + spacing.xl,
        }}
        renderItem={({ item: user }) => {
          // Map user data to match UserRow expectations
          const mappedUser = {
            ...user,
            avatarPhotoReference: user.avatar || user.avatarPhotoReference,
          };
          
          return (
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <UserRow user={mappedUser} rightKind="none" />
                </View>
                {canEdit && user.id !== trip?.ownerId && (
                  <Pressable
                    onPress={() => handleRemove(user.id)}
                    style={{ padding: spacing.sm }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.status?.danger || "#c33"} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <Card inset>
            <TText dim style={{ textAlign: "center" }}>
              {searchQuery.trim() 
                ? "No collaborators found matching your search."
                : "No collaborators yet."}
            </TText>
          </Card>
        )}
      />
    </View>
  );
}
