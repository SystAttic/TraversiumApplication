import * as SecureStore from "expo-secure-store";

// KEYS
const TOKEN_KEY = "traversium_token";
const PROFILE_KEY = "traversium_profile";

// Simulated DB (replace with API calls later)
const USERS = [
  { id: "u-ozbej", username: "ozbej", email: "ozbej@example.com", displayName: "Ozbej Pavc", password: "pass123", provider: "password" },
];

// Util
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const safeJSON = (s, f = null) => { try { return JSON.parse(s); } catch { return f; } };

export async function getSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  const profile = safeJSON(raw, null);
  return token ? { token, profile } : null;
}

export async function signOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function signInWithPassword({ usernameOrEmail, password }) {
  await delay(500);
  const u = USERS.find(
    (x) =>
      x.username?.toLowerCase() === String(usernameOrEmail).toLowerCase() ||
      x.email?.toLowerCase() === String(usernameOrEmail).toLowerCase()
  );
  if (!u || u.password !== password) {
    const err = new Error("Invalid credentials");
    err.code = "BAD_CREDENTIALS";
    throw err;
  }
  const token = `tok_${Date.now()}`;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify({ id: u.id, username: u.username, displayName: u.displayName, email: u.email, provider: u.provider }));
  return { token };
}

// Stub for Google — later replace with expo-auth-session
export async function signInWithGoogle() {
  await delay(600);
  // Simulate Google returning a profile with email+name but no username
  const googleProfile = {
    id: `g_${Date.now()}`,
    email: "example@gmail.com",
    displayName: "New Google User",
    provider: "google",
    username: null, // must be set in app later
  };
  const token = `tok_${Date.now()}`;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(googleProfile));
  return { token, profile: googleProfile };
}

export async function registerUser(payload) {
  await delay(600);
  // Basic checks (server should do this later)
  if (!payload?.email || !payload?.username || !payload?.password) {
    const e = new Error("Required fields are missing");
    e.code = "BAD_INPUT";
    throw e;
  }
  if (USERS.some((x) => x.username?.toLowerCase() === payload.username.toLowerCase())) {
    const e = new Error("Username is taken");
    e.code = "USERNAME_TAKEN";
    throw e;
  }
  if (USERS.some((x) => x.email?.toLowerCase() === payload.email.toLowerCase())) {
    const e = new Error("Email is already in use");
    e.code = "EMAIL_TAKEN";
    throw e;
  }
  const u = {
    id: `u_${Date.now()}`,
    username: payload.username,
    email: payload.email,
    displayName: payload.displayName || payload.firstName || payload.username,
    password: payload.password,
    provider: payload.provider || "password",
    dob: payload.dob || null,
  };
  USERS.push(u);
  const token = `tok_${Date.now()}`;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify({
    id: u.id, username: u.username, displayName: u.displayName, email: u.email, provider: u.provider
  }));
  return { token };
}

export async function requestPasswordReset(email) {
  await delay(500);
  const u = USERS.find((x) => x.email?.toLowerCase() === String(email).toLowerCase());
  if (!u) {
    // to avoid account enumeration, pretend success
    return { ok: true, strategy: "unknown" };
  }
  if (u.provider === "google") {
    // can't reset password in-app for Google accounts
    return { ok: true, strategy: "oauth" };
  }
  // send email (simulated)
  return { ok: true, strategy: "email" };
}

export async function completeGoogleSetUsername({ username, displayName }) {
  await delay(400);
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  const p = safeJSON(raw, null);
  if (!p) throw new Error("No active session");
  p.username = p.username || username;
  if (displayName) p.displayName = displayName;
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(p));
  return { ok: true, profile: p };
}
