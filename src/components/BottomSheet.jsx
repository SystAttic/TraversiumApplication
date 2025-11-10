import React, { useEffect, useRef } from "react";
import { Modal, View, Pressable, Animated, Easing, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { spacing, radii } from "../theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BottomSheet({ visible, onClose, children, maxHeight = "80%" }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start from off-screen
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Calculate max height value
  const maxHeightValue = typeof maxHeight === "string" 
    ? (parseFloat(maxHeight) / 100) * SCREEN_HEIGHT 
    : maxHeight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              opacity: backdropOpacity,
            }}
          />
        </Pressable>
        
        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
            height: maxHeightValue,
            backgroundColor: colors.bg.layer1,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Handle bar */}
          <Pressable
            onPress={onClose}
            style={{
              alignItems: "center",
              paddingBottom: spacing.sm,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
              }}
            />
          </Pressable>
          
          {/* Content */}
          <View style={{ flex: 1 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

