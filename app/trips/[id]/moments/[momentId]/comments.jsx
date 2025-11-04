import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import PageMiniHeader from "../../../../../src/components/PageMiniHeader";
import CommentThread from "../../../../../src/components/comments/CommentThread";
import { fetchTripById } from "../../../../../src/data/trips";
import { mockCommentsForMoment } from "../../../../../src/data/comments";
import { useTheme } from "../../../../../src/theme";
import SafeBottomBar from "../../../../../src/components/SafeBottomBar";
import { spacing } from "../../../../../src/theme/spacing";

export default function MomentCommentsScreen() {
  const { id, momentId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [trip, setTrip] = useState(null);
  const [comments, setComments] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const t = await fetchTripById(String(id || "t1"));
      if (!on) return;
      setTrip(t);
      setComments(mockCommentsForMoment(String(momentId || "mo1")));
    })();
    return () => { on = false; };
  }, [id, momentId]);

  const submit = (text, replyTo) => {
    const now = Date.now();
    setComments(prev => {
      if (!prev) return prev;
      if (replyTo) {
        return prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies || []), { id: `r-${now}`, author: "You", text, time: now }] }
            : c
        );
      }
      return [{ id: `c-${now}`, author: "You", text, time: now, replies: [] }, ...prev];
    });
  };

  if (!trip || !comments) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const moment = (trip.moments || []).find(m => m.id === String(momentId));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      <PageMiniHeader
        bgUri={trip.coverUri}
        title={"Comments"}
        subtitle={moment?.title || ""}
      />

      {/* No wrapping ScrollView — CommentThread owns the FlatList */}
      <View style={{ flex: 1, paddingTop: spacing.md }}>
        <CommentThread data={comments} onSubmit={submit} />
      </View>

      {/* Empty inset at bottom so the composer breathes */}
      <SafeBottomBar backgroundColor={colors.bg.layer1} borderTopColor={colors.border} borderTopWidth={1} />
    </View>
  );
}
