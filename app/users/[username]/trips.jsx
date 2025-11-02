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
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import TabBarSpacer from "../../../src/components/TabBarSpacer";

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
      const [u, me, all] = await Promise.all([
        fetchUserByUsername(username),
        fetchMe(),
        fetchTrips(),
      ]);
      if (!m) return;
      setOwner(u);
      setViewer(me);
      const list = (all || []).filter((t) => (t.contributors || []).includes(u?.username));
      setTrips(u?.username === me?.username ? list : list.filter((t) => t.visibility === "public"));
    })();
    return () => (m = false);
  }, [username]);

  const title = owner && viewer && owner.username === viewer.username ? "My Trips" : "Their Trips";

  return (
    <Screen>
      <AppHeader title={title} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + 24 }}>
        {trips
          ? trips.map((t, i) => (
              <Link key={t.id || `utl-${i}`} href={`/trips/${t.id}`} asChild>
                <Pressable>
                  <Card style={{ padding: 0 }}>
                    <Image source={{ uri: t.cover }} style={{ width: "100%", height: 140 }} />
                    <View style={{ padding: spacing.lg }}>
                      <TText weight="bold">{t.title || "Untitled Trip"}</TText>
                      <TText dim>{t.subtitle || ""}</TText>
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
        <TabBarSpacer useTabBarHeight={false} />
      </ScrollView>
    </Screen>
  );
}
