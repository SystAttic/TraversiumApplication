import React, { useEffect, useState } from "react";
import { View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageMiniHeader from "../../../src/components/PageMiniHeader";
import { getTripById, updateTrip } from "../../../src/services/tripApi";
import { auth } from "../../../src/services/firebase";
import TText from "../../../src/components/TText";
import Button from "../../../src/components/Button";
import Input from "../../../src/components/Input";
import { spacing, radii } from "../../../src/theme/spacing";
import { useTheme } from "../../../src/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TRIP_BAR_BASE_HEIGHT } from "../../../src/components/trips/TripBottomBar";

export default function EditTripScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");

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
        
        const transformedTrip = {
          ...tripData,
          id: String(tripData.tripId),
          isCollaborator: isCollaborator || isOwner,
          ownerId: tripData.ownerId,
          currentUserId,
        };
        
        setTrip(transformedTrip);
        setTitle(tripData.title || "");
        setDescription(tripData.description || "");
        setVisibility(tripData.visibility?.toString() || "PRIVATE");
      } catch (error) {
        console.error("Failed to load trip:", error);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const canEdit = trip?.isCollaborator || trip?.ownerId === trip?.currentUserId;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Trip title is required");
      return;
    }

    setSaving(true);
    try {
      const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
      if (!tripIdNum || isNaN(tripIdNum)) {
        throw new Error("Invalid trip ID");
      }
      
      const tripDto = {
        tripId: tripIdNum,
        title: title.trim(),
        description: description.trim() || null,
        visibility: visibility,
        coverPhotoUrl: trip?.coverPhotoUrl || null,
        ownerId: trip?.ownerId || null,
        collaborators: trip?.collaborators || [],
        viewers: trip?.viewers || [],
        defaultAlbum: trip?.defaultAlbum || null,
        albums: trip?.albums || [],
      };
      
      await updateTrip(tripDto);
      Alert.alert("Success", "Trip updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Failed to update trip:", error);
      Alert.alert("Error", error?.message || "Failed to update trip");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <TText dim style={{ textAlign: "center" }}>
          You don't have permission to edit this trip.
        </TText>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <PageMiniHeader
        bgUri={trip?.coverUri}
        title="Edit Trip"
        subtitle={trip?.title || ""}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: TRIP_BAR_BASE_HEIGHT + insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Trip Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter trip title"
        />

        <View style={{ marginBottom: spacing.md }}>
          <TText weight="medium" style={{ marginBottom: spacing.xs }}>Description</TText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter trip description"
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: colors.bg.layer2,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.text.primary,
              textAlignVertical: "top",
              minHeight: 100,
            }}
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <TText weight="medium" style={{ marginBottom: spacing.sm }}>Visibility</TText>
          <View style={{ flexDirection: "row" }}>
            <Pressable
              onPress={() => setVisibility("PUBLIC")}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: visibility === "PUBLIC" ? colors.accent.primary : colors.border,
                backgroundColor: visibility === "PUBLIC" ? colors.accent.primary + "22" : colors.bg.layer2,
                alignItems: "center",
                marginRight: spacing.sm,
              }}
            >
              <Ionicons name="globe-outline" size={20} color={visibility === "PUBLIC" ? colors.accent.primary : colors.text.muted} />
              <TText size="sm" weight="medium" style={{ marginTop: spacing.xs, color: visibility === "PUBLIC" ? colors.accent.primary : colors.text.primary }}>
                Public
              </TText>
            </Pressable>
            <Pressable
              onPress={() => setVisibility("PRIVATE")}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: visibility === "PRIVATE" ? colors.accent.primary : colors.border,
                backgroundColor: visibility === "PRIVATE" ? colors.accent.primary + "22" : colors.bg.layer2,
                alignItems: "center",
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={visibility === "PRIVATE" ? colors.accent.primary : colors.text.muted} />
              <TText size="sm" weight="medium" style={{ marginTop: spacing.xs, color: visibility === "PRIVATE" ? colors.accent.primary : colors.text.primary }}>
                Private
              </TText>
            </Pressable>
          </View>
        </View>

        <Button 
          title="Save Changes" 
          onPress={handleSave}
          loading={saving}
        />
        <Button 
          title="Cancel" 
          variant="outline" 
          onPress={() => router.back()} 
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </View>
  );
}

