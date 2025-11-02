import React, { useEffect, useState } from "react";
import { ScrollView, View, Image, Pressable } from "react-native";
import Screen from "../../../src/components/Screen";
import AppHeader from "../../../src/components/AppHeader";
import Card from "../../../src/components/Card";
import TText from "../../../src/components/TText";
import Button from "../../../src/components/Button";
import { useTheme } from "../../../src/theme";
import { spacing } from "../../../src/theme/spacing";
import { Link } from "expo-router";
import { fetchTrips } from "../../../src/data/api";
import SkeletonRect from "../../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../../src/components/skeleton/SkeletonText";

export default function TripsList() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    let m = true;
    (async () => {
      const t = await fetchTrips();
      if (!m) return;
      setData(t);
    })();
    return () => (m = false);
  }, []);

  return (
    <Screen>
      <AppHeader title="Your Trips" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.lg }}>
          {(data || Array.from({ length: 3 })).map((t, idx) =>
            data ? (
              <Link key={t.id} href={`/trips/${t.id}`} asChild>
                <Pressable>
                  <Card style={{ padding: 0 }}>
                    <Image source={{ uri: t.cover }} style={{ width: "100%", height: 160 }} />
                    <View style={{ padding: spacing.lg }}>
                      <TText weight="bold">{t.title}</TText>
                      <TText dim>{t.subtitle}</TText>
                      <View style={{ marginTop: spacing.md }}>
                        <Button title="Open trip" variant="outline" />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            ) : (
              <Card key={idx} style={{ padding: 0 }}>
                <SkeletonRect height={160} radius={12} />
                <View style={{ padding: spacing.lg }}>
                  <SkeletonText lines={1} />
                  <SkeletonText lines={1} />
                </View>
              </Card>
            )
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
