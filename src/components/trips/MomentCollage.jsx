import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";
import AuthenticatedImage from "../AuthenticatedImage";

// A simple collage: first hero wide, next row 2-up, then 3 mosaic, repeat.
// Falls back gracefully with 1-2 items.

export default function MomentCollage({ media = [], onOpen }) {
  const { colors } = useTheme();

  const tiles = useMemo(() => {
    const arr = media.slice(0);
    const out = [];
    let i = 0;
    while (i < arr.length) {
      if (i === 0 && arr.length > 0) {
        // hero
        out.push({ type: "hero", items: [arr[i]] });
        i += 1;
      } else if (i + 2 <= arr.length) {
        // 2-up row
        out.push({ type: "two", items: [arr[i], arr[i + 1]] });
        i += 2;
      } else {
        // leftovers as singles
        out.push({ type: "single", items: [arr[i]] });
        i += 1;
      }
      // sprinkle an occasional three mosaic when enough remain
      if (i + 3 <= arr.length) {
        out.push({ type: "three", items: [arr[i], arr[i + 1], arr[i + 2]] });
        i += 3;
      }
    }
    return out;
  }, [media]);

  const Hero = ({ m }) => (
    <Pressable onPress={() => onOpen?.(m)} style={{ marginBottom: 8 }}>
      <AuthenticatedImage
        source={{ uri: m.uri }}
        style={{
          width: "100%",
          height: 220,
          borderRadius: 12,
          backgroundColor: colors.bg.layer3,
        }}
        resizeMode="cover"
      />
    </Pressable>
  );

  const TwoUp = ({ a, b }) => (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
      {[a, b].filter(Boolean).map((m) => (
        <Pressable key={m.id} onPress={() => onOpen?.(m)} style={{ flex: 1 }}>
          <AuthenticatedImage
            source={{ uri: m.uri }}
            style={{
              width: "100%",
              height: 140,
              borderRadius: 12,
              backgroundColor: colors.bg.layer3,
            }}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </View>
  );

  const Three = ({ a, b, c }) => (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
      {/* Left tall (a), right stacked (b,c) */}
      {!!a && (
        <Pressable onPress={() => onOpen?.(a)} style={{ flex: 1 }}>
          <AuthenticatedImage
            source={{ uri: a.uri }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              backgroundColor: colors.bg.layer3,
            }}
            resizeMode="cover"
          />
        </Pressable>
      )}
      <View style={{ flex: 1, gap: 8 }}>
        {[b, c].filter(Boolean).map((m) => (
          <Pressable key={m.id} onPress={() => onOpen?.(m)} style={{ flex: 1 }}>
            <AuthenticatedImage
              source={{ uri: m.uri }}
              style={{
                width: "100%",
                height: 96,
                borderRadius: 12,
                backgroundColor: colors.bg.layer3,
              }}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const Single = ({ m }) => (
    <Pressable onPress={() => onOpen?.(m)} style={{ marginBottom: 8 }}>
      <AuthenticatedImage
        source={{ uri: m.uri }}
        style={{
          width: "100%",
          height: 180,
          borderRadius: 12,
          backgroundColor: colors.bg.layer3,
        }}
        resizeMode="cover"
      />
    </Pressable>
  );

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {tiles.map((row, idx) => {
        if (row.type === "hero") return <Hero key={`hero-${row.items[0]?.id || idx}`} m={row.items[0]} />;
        if (row.type === "two") return <TwoUp key={`two-${idx}`} a={row.items[0]} b={row.items[1]} />;
        if (row.type === "three") return <Three key={`three-${idx}`} a={row.items[0]} b={row.items[1]} c={row.items[2]} />;
        return <Single key={`single-${row.items[0]?.id || idx}`} m={row.items[0]} />;
      })}
    </View>
  );
}
