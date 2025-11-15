// src/components/trips/MomentCard.jsx
import React, { useMemo } from "react";
import { View, Image, Pressable } from "react-native";
import Card from "../Card";
import TText from "../TText";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../../theme";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function MomentCard({ moment, mediaById = {}, onOpen }) {
  const { colors } = useTheme();
  const media = (moment.mediaIds || []).map(id => mediaById[id]).filter(Boolean);
  const mediaCount = media.length;

  // Smart preview layout based on media count
  const previewLayout = useMemo(() => {
    if (mediaCount === 0) return null;
    if (mediaCount === 1) {
      return { type: "single", items: [media[0]] };
    }
    if (mediaCount === 2) {
      return { type: "two", items: [media[0], media[1]] };
    }
    if (mediaCount === 3) {
      return { type: "three", items: [media[0], media[1], media[2]] };
    }
    if (mediaCount === 4) {
      return { type: "four", items: [media[0], media[1], media[2], media[3]] };
    }
    // 5+ media: show first 4 with "..." indicator
    return { type: "many", items: [media[0], media[1], media[2], media[3]], total: mediaCount };
  }, [media, mediaCount]);

  const renderPreview = () => {
    if (!previewLayout) return null;

    const { type, items, total } = previewLayout;
    const gap = spacing.xs;

    if (type === "single") {
      return (
        <Pressable onPress={() => onOpen?.()} style={{ marginTop: spacing.sm }}>
          <Image
            source={{ uri: items[0].uri }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: radii.md,
              backgroundColor: colors.bg.layer3,
            }}
            resizeMode="cover"
          />
        </Pressable>
      );
    }

    if (type === "two") {
      return (
        <View style={{ flexDirection: "row", marginTop: spacing.sm }}>
          {items.map((item, idx) => (
            <Pressable 
              key={item.id || idx} 
              onPress={() => onOpen?.()} 
              style={{ flex: 1, marginLeft: idx > 0 ? gap : 0 }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{
                  width: "100%",
                  height: 140,
                  borderRadius: radii.md,
                  backgroundColor: colors.bg.layer3,
                }}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </View>
      );
    }

    if (type === "three") {
      return (
        <View style={{ flexDirection: "row", marginTop: spacing.sm }}>
          {/* Left: large image */}
          <Pressable onPress={() => onOpen?.()} style={{ flex: 1, marginRight: gap }}>
            <Image
              source={{ uri: items[0].uri }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: radii.md,
                backgroundColor: colors.bg.layer3,
              }}
              resizeMode="cover"
            />
          </Pressable>
          {/* Right: vertical stack */}
          <View style={{ flex: 1 }}>
            {items.slice(1, 3).map((item, idx) => (
              <Pressable 
                key={item.id || idx} 
                onPress={() => onOpen?.()} 
                style={{ flex: 1, marginTop: idx > 0 ? gap : 0 }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: "100%",
                    height: 96,
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.layer3,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (type === "four") {
      return (
        <View style={{ marginTop: spacing.sm }}>
          {/* Top: 2x2 grid */}
          <View style={{ flexDirection: "row", marginBottom: gap }}>
            {items.slice(0, 2).map((item, idx) => (
              <Pressable 
                key={item.id || idx} 
                onPress={() => onOpen?.()} 
                style={{ flex: 1, marginLeft: idx > 0 ? gap : 0 }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: "100%",
                    height: 100,
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.layer3,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
          {/* Bottom: horizontal with last 2 */}
          <View style={{ flexDirection: "row" }}>
            {items.slice(2, 4).map((item, idx) => (
              <Pressable 
                key={item.id || idx} 
                onPress={() => onOpen?.()} 
                style={{ flex: 1, marginLeft: idx > 0 ? gap : 0 }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: "100%",
                    height: 100,
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.layer3,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (type === "many") {
      return (
        <View style={{ marginTop: spacing.sm }}>
          {/* Top: 2x2 grid */}
          <View style={{ flexDirection: "row", marginBottom: gap }}>
            {items.slice(0, 2).map((item, idx) => (
              <Pressable 
                key={item.id || idx} 
                onPress={() => onOpen?.()} 
                style={{ flex: 1, marginLeft: idx > 0 ? gap : 0 }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: "100%",
                    height: 100,
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.layer3,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
          {/* Bottom: horizontal with last 2 and "..." indicator */}
          <View style={{ flexDirection: "row" }}>
            {items.slice(2, 4).map((item, idx) => (
              <Pressable 
                key={item.id || idx} 
                onPress={() => onOpen?.()} 
                style={{ flex: 1, marginLeft: idx > 0 ? gap : 0 }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: "100%",
                    height: 100,
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.layer3,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
            {/* "..." indicator */}
            <Pressable
              onPress={() => onOpen?.()}
              style={{
                flex: 1,
                height: 100,
                marginLeft: gap,
                borderRadius: radii.md,
                backgroundColor: colors.bg.layer3,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <TText weight="bold" size="lg" style={{ color: colors.text.muted }}>
                +{total - 4}
              </TText>
            </Pressable>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Pressable onPress={() => onOpen?.()}>
      <Card style={{ overflow: "hidden" }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs }}>
            <TText weight="bold" style={{ flex: 1 }} numberOfLines={1}>
              {moment.title}
            </TText>
            {mediaCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: spacing.sm }}>
                <Ionicons name="images-outline" size={14} color={colors.text.muted} />
                <TText size="sm" dim style={{ marginLeft: 4 }}>{mediaCount}</TText>
              </View>
            )}
          </View>
          {!!moment.description && (
            <TText dim size="sm" numberOfLines={2} style={{ marginTop: 2 }}>
              {moment.description}
            </TText>
          )}
        </View>

        {/* Preview Grid */}
        {renderPreview()}

        {/* Empty state */}
        {mediaCount === 0 && (
          <View
            style={{
              marginTop: spacing.sm,
              height: 120,
              borderRadius: radii.md,
              backgroundColor: colors.bg.layer3,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
            }}
          >
            <Ionicons name="images-outline" size={32} color={colors.text.muted} />
            <TText dim size="sm" style={{ marginTop: spacing.xs }}>
              No media
            </TText>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
