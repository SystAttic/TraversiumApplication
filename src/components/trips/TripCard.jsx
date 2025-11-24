import React from "react";
import { View, Image, Pressable } from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Card from "../Card";
import TText from "../TText";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import { getMediaFileUrl } from "../../services/fileStorageApi";

export default function TripCard({ trip, onPress }) {
  const { colors } = useTheme();
  
  // Safe field extraction
  const tripId = trip?.tripId;
  const title = trip?.title || "Untitled Trip";
  const description = trip?.description || "";
  const coverPhotoUrl = trip?.coverPhotoUrl;
  const visibility = trip?.visibility || "PRIVATE";
  const collaborators = Array.isArray(trip?.collaborators) ? trip.collaborators : [];
  const albums = Array.isArray(trip?.albums) ? trip.albums : [];
  const totalMedia = albums.reduce((sum, album) => sum + (Array.isArray(album?.media) ? album.media.length : 0), 0);

  // Use default cover if no cover photo
  const coverSource = coverPhotoUrl 
    ? { uri: getMediaFileUrl(coverPhotoUrl) }
    : require("../../../assets/cover-default.jpg");

  const cardContent = (
    <Card style={{ padding: 0 }}>
      <Image
        source={coverSource}
        style={{ width: "100%", height: 100 }}
        resizeMode="cover"
      />
      <View style={{ padding: spacing.md }}>
        {/* Title and Icons Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <TText weight="bold" size="md">{title}</TText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            {/* Media icon */}
            {totalMedia > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="images-outline" size={16} color={colors.text.muted} />
                <TText size="sm" style={{ color: colors.text.muted }}>{totalMedia}</TText>
              </View>
            )}
            {/* Collaborators icon */}
            {collaborators.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="people-outline" size={16} color={colors.text.muted} />
                <TText size="sm" style={{ color: colors.text.muted }}>{collaborators.length}</TText>
              </View>
            )}
            {/* Visibility icon */}
            <Ionicons 
              name={visibility === "PUBLIC" ? "globe-outline" : "lock-closed-outline"} 
              size={16} 
              color={colors.text.muted} 
            />
          </View>
        </View>
        
        {/* Description (2 lines max) */}
        {description ? (
          <TText 
            dim 
            size="sm" 
            style={{ 
              marginTop: spacing.xs,
              lineHeight: 18,
              maxHeight: 36, // 2 lines * 18px line height
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {description}
          </TText>
        ) : null}
      </View>
    </Card>
  );

  if (tripId && onPress) {
    return (
      <Pressable onPress={() => onPress(tripId)}>
        {cardContent}
      </Pressable>
    );
  }

  if (tripId) {
    return (
      <Link href={`/trips/${tripId}`} asChild>
        <Pressable>{cardContent}</Pressable>
      </Link>
    );
  }

  return cardContent;
}

