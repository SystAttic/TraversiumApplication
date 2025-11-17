import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, FlatList, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageMiniHeader from "../../../src/components/PageMiniHeader";
import { getTripById, removeViewerFromTrip } from "../../../src/services/tripApi";
import { auth } from "../../../src/services/firebase";
import TText from "../../../src/components/TText";
import Card from "../../../src/components/Card";
import UserRow from "../../../src/components/users/UserRow";
import SearchBar from "../../../src/components/SearchBar";
import { spacing } from "../../../src/theme/spacing";
import { useTheme } from "../../../src/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TRIP_BAR_BASE_HEIGHT } from "../../../src/components/trips/TripBottomBar";

export default function ViewersScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
        if (!tripIdNum || isNaN(tripIdNum)) {
          console.error("Invalid trip ID:", id);
          return;
        }
        
        const tripData = await getTripById(tripIdNum);
        if (!on) return;
        
        const currentUserId = auth.currentUser?.uid || null;
        const isCollaborator = tripData.collaborators?.includes(currentUserId) || false;
        const isOwner = tripData.ownerId === currentUserId;
        
        // Transform viewers (for now just IDs, will need user API later)
        const viewers = tripData.viewers?.map((firebaseId) => ({
          id: firebaseId,
          username: firebaseId, // Placeholder
          displayName: firebaseId, // Placeholder
        })) || [];
        
        const transformedTrip = {
          ...tripData,
          id: String(tripData.tripId),
          tripId: tripData.tripId,
          isCollaborator: isCollaborator || isOwner,
          ownerId: tripData.ownerId,
          currentUserId,
          viewers,
        };
        
        setTrip(transformedTrip);
      } catch (error) {
        console.error("Failed to load trip:", error);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const viewers = Array.isArray(trip?.viewers) ? trip.viewers : [];
  const canEdit = trip?.isCollaborator || trip?.ownerId === trip?.currentUserId;

  const filteredViewers = useMemo(() => {
    if (!searchQuery.trim()) return viewers;
    const query = searchQuery.toLowerCase();
    return viewers.filter(user => {
      const name = (user.displayName || user.username || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      return name.includes(query) || username.includes(query);
    });
  }, [viewers, searchQuery]);

  const handleRemove = (userId) => {
    Alert.alert(
      "Remove Viewer",
      "Are you sure you want to remove this viewer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
              if (!tripIdNum || isNaN(tripIdNum)) {
                throw new Error("Invalid trip ID");
              }
              
              await removeViewerFromTrip(tripIdNum, userId);
              
              // Reload trip data
              const tripData = await getTripById(tripIdNum);
              const currentUserId = auth.currentUser?.uid || null;
              const isCollaborator = tripData.collaborators?.includes(currentUserId) || false;
              const isOwner = tripData.ownerId === currentUserId;
              
              const viewers = tripData.viewers?.map((firebaseId) => ({
                id: firebaseId,
                username: firebaseId,
                displayName: firebaseId,
              })) || [];
              
              setTrip({
                ...tripData,
                id: String(tripData.tripId),
                tripId: tripData.tripId,
                isCollaborator: isCollaborator || isOwner,
                ownerId: tripData.ownerId,
                currentUserId,
                viewers,
              });
              
              Alert.alert("Success", "Viewer removed successfully");
            } catch (error) {
              console.error("Failed to remove viewer:", error);
              Alert.alert("Error", error?.message || "Failed to remove viewer");
            }
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
        title="Viewers"
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
          placeholder="Search viewers..."
          onClear={() => setSearchQuery("")}
        />
      </View>

      <FlatList
        data={filteredViewers}
        keyExtractor={(item) => item.id || `viewer-${item.username}`}
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
                {canEdit && (
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
                ? "No viewers found matching your search."
                : "No viewers yet."}
            </TText>
          </Card>
        )}
      />
    </View>
  );
}
