import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "traversium_token";
const PROFILE_KEY = "traversium_profile";

export async function saveFirebaseSession(user) {
	try {
		if (!user) return;
		const token = await user.getIdToken();
		await SecureStore.setItemAsync(TOKEN_KEY, token);
		const profile = {
			id: user.uid,
			email: user.email || null,
			displayName: user.displayName || null,
			provider: "firebase",
		};
		await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
		return token;
	} catch {
		// ignore
	}
}

export async function clearSavedSession() {
	try {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		await SecureStore.deleteItemAsync(PROFILE_KEY);
	} catch {
		// ignore
	}
}


