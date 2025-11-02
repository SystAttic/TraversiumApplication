import React, { useEffect, useState } from "react";
import { ScrollView, View, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../src/components/Screen";
import { useTheme } from "../../src/theme";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import StatusPill from "../../src/components/StatusPill";
import { spacing } from "../../src/theme/spacing";
import { fetchTrip, fetchMoments } from "../../src/data/api";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";

export default function TripView() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const [trip, setTrip] = useState(null);
  const [moments, setMoments] = useState(null);

  useEffect(() => {
    let m = true;
    (async () => {
      const [t, ms] = await Promise.all([fetchTrip(id), fetchMoments(id)]);
      if (!m) return;
      setTrip(t);
      setMoments(ms);
    })();
    return () => (m = false);
  }, [id]);

  return (
    <Screen>
      <AppHeader title={trip ? trip.title : "Trip"} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          {trip ? (
            <>
              <TText dim>{trip.subtitle}</TText>
              <TText weight="bold" size="lg" style={{ marginTop: 4 }}>
                {trip.title}
              </TText>
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
                <Button title="Add Moment" />
                <Button title="Share" variant="outline" />
              </View>
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
                <StatusPill type="info" label={`${moments ? moments.length : 0} moments`} />
                <StatusPill type="success" label={`${trip.contributors?.length || 1} contributors`} />
              </View>
            </>
          ) : (
            <>
              <SkeletonText lines={1} />
              <SkeletonText lines={2} />
            </>
          )}
        </Card>

        <View style={{ gap: spacing.md }}>
          <TText weight="medium">Moments</TText>
          <View style={{ gap: spacing.lg }}>
            {(moments || Array.from({ length: 3 })).map((m, i) =>
              moments ? (
                <Card key={m.id} style={{ padding: 0 }}>
                  <Image source={{ uri: m.cover }} style={{ width: "100%", height: 170 }} />
                  <View style={{ padding: spacing.lg }}>
                    <TText weight="bold">{m.title}</TText>
                    <TText dim>{m.count} items</TText>
                  </View>
                </Card>
              ) : (
                <Card key={i} style={{ padding: 0 }}>
                  <SkeletonRect height={170} radius={12} />
                  <View style={{ padding: spacing.lg }}>
                    <SkeletonText lines={1} />
                    <SkeletonText lines={1} />
                  </View>
                </Card>
              )
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
