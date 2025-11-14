import { auth } from "../services/firebase";
import { getUser, searchUsersByUsername } from "../services/userApi";
import { getAllTrips, getTripById, getTripsByViewer, searchTripsByTitle, getTripsByCollaborator } from "../services/tripApi";

// ---- USER ----

/**
 * Get current authenticated user
 * Uses Firebase auth to get email, then fetches user profile from API
 */
export async function fetchMe() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || !firebaseUser.email) {
    throw new Error("No authenticated user");
  }
  return getUser({ email: firebaseUser.email });
}

/**
 * Get user by username
 */
export async function fetchUserByUsername(username) {
  return getUser({ username });
}

// ---- TRIPS ----

/**
 * Get all trips accessible to current user
 */
export async function fetchTrips(offset = 0, limit = 100) {
  return getAllTrips(offset, limit);
}

/**
 * Get trip by ID
 */
export async function fetchTrip(id) {
  return getTripById(id);
}

/**
 * Get trips where current user is a collaborator
 * Note: This uses Firebase UID, not username
 */
export async function fetchTripsByCollaborator(collaboratorId, offset = 0, limit = 100) {
  return getTripsByCollaborator(collaboratorId, offset, limit);
}

/**
 * Get trips viewable by current user
 */
export async function fetchTripsByViewer(offset = 0, limit = 100) {
  return getTripsByViewer(offset, limit);
}

// ---- MOMENTS ----
// TODO: Implement when moment API is available
export async function fetchMoments(id) {
  // Placeholder - implement when moment API is ready
  return [];
}

// ---- SEARCH ----
const norm = (s) => (s || "").toLowerCase();

/**
 * Search trips by title
 */
export async function searchTrips({ query = "", scope = "public", offset = 0, limit = 20 }) {
  if (!query) {
    // If no query, return all trips based on scope
    if (scope === "mine") {
      return fetchTripsByViewer(offset, limit);
    }
    return fetchTrips(offset, limit);
  }
  return searchTripsByTitle(query, offset, limit);
}

/**
 * Search profiles by username
 * @param {string} query - Search query
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 */
export async function searchProfiles({ query = "", offset = 0, limit = 20 }) {
  if (!query.trim()) {
    return [];
  }
  return searchUsersByUsername(query.trim(), offset, limit);
}
