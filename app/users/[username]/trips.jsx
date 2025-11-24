import React, { useEffect, useState } from "react";
import { ScrollView, View, Image, Pressable } from "react-native";
import Screen from "../../../src/components/Screen";
import AppHeader from "../../../src/components/AppHeader";
import Card from "../../../src/components/Card";
import TText from "../../../src/components/TText";
import { spacing } from "../../../src/theme/spacing";
import { useTheme } from "../../../src/theme";
import { useLocalSearchParams, Link } from "expo-router";
import { fetchTrips, fetchUserByUsername, fetchMe } from "../../../src/data/api";
import SkeletonRect from "../../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../../src/components/skeleton/SkeletonText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMediaFileUrl } from "../../../src/services/fileStorageApi";

export default function UserTripsList() {
  const { username } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [owner, setOwner] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const [u, me, all] = await Promise.all([
          fetchUserByUsername(username),
          fetchMe().catch(() => null), // Allow trips view even if current user fetch fails
          fetchTrips(),
        ]);
        if (!m) return;
        setOwner(u);
        setViewer(me);
        // Filter trips where user is owner or collaborator
        const collaborators = (all || []).filter((t) => {
          const tripCollaborators = t.collaborators || [];
          const ownerId = t.ownerId;
          return tripCollaborators.includes(u?.firebaseId) || ownerId === u?.firebaseId;
        });
        const isOwnProfile = u && me && u.firebaseId === me.firebaseId;
        setTrips(isOwnProfile ? collaborators : collaborators.filter((t) => t.visibility === "PUBLIC"));
      } catch (error) {
        console.error("Error loading trips:", error);
      }
    })();
    return () => (m = false);
  }, [username]);

  const title = owner && viewer && owner.firebaseId === viewer.firebaseId ? "My Trips" : "Their Trips";

  return (
    <Screen>
      <AppHeader title={title} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.sm }}>
        {trips
          ? trips.map((t, i) => (
              <Link key={t.tripId || `utl-${i}`} href={`/trips/${t.tripId}`} asChild>
                <Pressable>
                  <Card style={{ padding: 0 }}>
                    <Image 
                      source={t.coverPhotoUrl ? { uri: getMediaFileUrl(t.coverPhotoUrl) } : require("../../../assets/cover-default.jpg")} 
                      style={{ width: "100%", height: 140 }} 
                    />
                    <View style={{ padding: spacing.lg }}>
                      <TText weight="bold">{t.title || "Untitled Trip"}</TText>
                      <TText dim>{t.description || ""}</TText>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <Card key={`utl-skel-${i}`} style={{ padding: 0 }}>
                <SkeletonRect height={140} />
                <View style={{ padding: spacing.lg }}>
                  <SkeletonText lines={1} />
                  <SkeletonText lines={1} />
                </View>
              </Card>
            ))}
      </ScrollView>
    </Screen>
  );
}
