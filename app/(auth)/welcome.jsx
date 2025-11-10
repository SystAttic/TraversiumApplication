import React from "react";
import { View, Image, Pressable } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import TText from "../../src/components/TText";
import AuthBackground from "../../src/components/auth/AuthBackground";
import AuthCard from "../../src/components/auth/AuthCard";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function WelcomeScreen() {
	const { colors, isDark } = useTheme();
	const lightIcon = require("../../assets/adaptive-icon.png");
	const darkIcon = require("../../assets/adaptive-icon-dark.png");
	return (
		<AuthBackground source={require("../../assets/auth_header.jpg")}>
			<View style={{ alignItems: "center", marginTop: 54 }}>
				<TText weight="bold" style={{ fontSize: 28, letterSpacing: 2 }}>TRAVERSIUM</TText>
			</View>

			<AuthCard style={{ marginTop: 24 }}>
				<View style={{ flexGrow: 1, justifyContent: "space-between" }}>
					{/* Top brand block */}
					<View style={{ alignItems: "center" }}>
						<Image source={isDark ? darkIcon : lightIcon} style={{ width: 92, height: 92, borderRadius: 20 }} />
						<View style={{ height: spacing.lg }} />
						<TText weight="bold" style={{ fontSize: 22 }}>Welcome aboard!</TText>
						<TText dim style={{ marginTop: spacing.md, textAlign: "center" }}>
							It takes only one app to have perfectly organized and stored photos.
						</TText>
					</View>

					{/* Bottom CTA block */}
					<View style={{ gap: spacing.sm }}>
						<Link href="/(auth)/register" asChild>
							<Pressable style={{ borderRadius: 14, overflow: "hidden" }}>
								<LinearGradient
									colors={[colors.accent.primary, colors.accent.primary]}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
									style={{ padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
								>
									<Ionicons name="rocket-outline" size={18} color="#fff" />
									<TText style={{ color: "#fff" }}>Get started</TText>
								</LinearGradient>
							</Pressable>
						</Link>

						<Link href="/(auth)/login" asChild>
							<Pressable style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
								<Ionicons name="log-in-outline" size={18} color={colors.text.primary} />
								<TText>I already have an account</TText>
							</Pressable>
						</Link>
					</View>
				</View>
			</AuthCard>
			<View style={{ alignItems:"center", marginTop: spacing.lg }}>
				<TText dim size="sm">© {new Date().getFullYear()} Traversium</TText>
			</View>
		</AuthBackground>
	);
}


