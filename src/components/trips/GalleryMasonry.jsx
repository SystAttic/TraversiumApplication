import React, { useMemo } from "react";
import { View, Pressable, FlatList } from "react-native";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";
import TText from "../TText";
import AuthenticatedImage from "../AuthenticatedImage";

export default function GalleryMasonry({ media = [], onOpen }) {
  const { colors } = useTheme();

  // simple 2-column split by cumulative height heuristic
  const { left, right } = useMemo(() => {
    const l = []; const r = [];
    let lh=0, rh=0;
    media.forEach(m => {
      const ratio = (m.h||1)/(m.w||1);
      const est = ratio; // rough
      if (lh <= rh) { l.push(m); lh += est; } else { r.push(m); rh += est; }
    });
    return { left:l, right:r };
  }, [media]);

  const Col = ({ data }) => (
    <View style={{ flex: 1, gap: 8 }}>
      {data.map((m) => {
        const ratio = (m.h || 1) / (m.w || 1);
        const height = Math.max(100, Math.min(220, 160 * ratio));
        return (
          <Pressable key={m.id} onPress={() => onOpen?.(m)}>
            <AuthenticatedImage
              source={{ uri: m.uri }}
              style={{
                width: "100%",
                height,
                borderRadius: 12,
                backgroundColor: colors.bg.layer3,
              }}
              resizeMode="cover"
            />
          </Pressable>
        );
      })}
    </View>
  );

  if (!media.length) {
    return <TText dim style={{ padding: spacing.xl }}>No media yet.</TText>;
  }

  // Use FlatList outer to allow scrolling & padding
  return (
    <FlatList
      data={[{key:"grid"}]}
      keyExtractor={i => i.key}
      renderItem={() => (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Col data={left} />
          <Col data={right} />
        </View>
      )}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}
    />
  );
}
