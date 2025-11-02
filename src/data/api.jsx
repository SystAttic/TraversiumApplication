import { trips } from "./trips";
import { momentsByTrip } from "./moments";
import { currentUser } from "./user";
import { users } from "./users";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchTrips() {
  await wait(300);
  return trips;
}
export async function fetchTrip(id) {
  await wait(250);
  return trips.find((t) => t.id === id) || null;
}
export async function fetchMoments(id) {
  await wait(350);
  return momentsByTrip[id] || [];
}
export async function fetchMe() {
  await wait(200);
  return currentUser;
}

// ---- SEARCH ----
const norm = (s) => (s || "").toLowerCase();

export async function searchTrips({ query = "", scope = "public", me = currentUser }) {
  await wait(320);
  const q = norm(query);
  const mineIds = new Set(me?.joinedTrips || []);
  return trips.filter((t) => {
    const inScope = scope === "mine" ? mineIds.has(t.id) : t.visibility === "public";
    if (!inScope) return false;
    if (!q) return true;
    const hay = [t.title, t.subtitle, ...(t.tags || []), ...(t.contributors || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export async function searchProfiles({ query = "" }) {
  await wait(280);
  const q = norm(query);
  const raw = users.filter((u) => {
    if (!q) return true;
    const hay = [u.name, u.username, u.location, u.bio].join(" ").toLowerCase();
    return hay.includes(q);
  });

  const seen = new Set();
  const out = [];
  for (const u of raw) {
    const key = u.id ?? u.username;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

export async function fetchUserByUsername(username) {
  await wait(220);
  return users.find((u) => u.username.toLowerCase() === String(username).toLowerCase()) || null;
}
