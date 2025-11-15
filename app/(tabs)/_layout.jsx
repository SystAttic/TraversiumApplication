import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "../../src/theme";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

function TabBackground() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg.layer2 }} />;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { backgroundColor: colors.bg.layer2, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarBackground: () => <TabBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trips/index"
        options={{
          title: t("tabs.trips"),
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
