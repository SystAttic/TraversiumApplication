// Social API functions using real UserService APIs
import { getFollowers, getFollowing, getBlockedUsers, unblockUser as apiUnblockUser } from "../services/userApi";
import { fetchMe } from "./api";

/**
 * Get followers of the current user
 * @returns {Promise<UserDto[]>}
 */
export async function fetchFollowers() {
  const me = await fetchMe();
  if (!me || !me.username) {
    throw new Error("User not authenticated");
  }
  return getFollowers(me.username, 0, 100);
}

/**
 * Get users that the current user is following
 * @returns {Promise<UserDto[]>}
 */
export async function fetchFollowing() {
  const me = await fetchMe();
  if (!me || !me.username) {
    throw new Error("User not authenticated");
  }
  return getFollowing(me.username, 0, 100);
}

/**
 * Get blocked users for the current user
 * @returns {Promise<UserDto[]>}
 */
export async function fetchBlocked() {
  return getBlockedUsers(0, 100);
}

/**
 * Unblock a user
 * @param {Object} user - User object with username
 * @returns {Promise<void>}
 */
export async function unblockUser(user) {
  if (!user || !user.username) {
    throw new Error("User username is required");
  }
  return apiUnblockUser(user.username);
}
