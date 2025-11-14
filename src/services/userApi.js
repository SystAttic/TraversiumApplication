// UserService API client
import { http } from "./traversiumApi";

/**
 * Check if a user exists by username or email
 * @param {Object} params - { username?: string, email?: string }
 * @returns {Promise<{exists: boolean}>}
 */
export async function checkUserExists({ username, email }) {
  const params = new URLSearchParams();
  if (username) params.append("username", username);
  if (email) params.append("email", email);
  return http(`/rest/v1/users/exists?${params.toString()}`, { method: "GET" });
}

/**
 * Create a new user
 * @param {Object} userDto - UserDto object
 * @returns {Promise<UserDto>}
 */
export async function createUser(userDto) {
  return http(`/rest/v1/users`, {
    method: "POST",
    body: JSON.stringify(userDto),
  });
}

/**
 * Get user by username or email
 * @param {Object} params - { username?: string, email?: string }
 * @returns {Promise<UserDto>}
 */
export async function getUser({ username, email }) {
  const params = new URLSearchParams();
  if (username) params.append("username", username);
  if (email) params.append("email", email);
  return http(`/rest/v1/users?${params.toString()}`, { method: "GET" });
}

/**
 * Update user
 * @param {Object} userDto - UserDto object
 * @returns {Promise<UserDto>}
 */
export async function updateUser(userDto) {
  return http(`/rest/v1/users`, {
    method: "PUT",
    body: JSON.stringify(userDto),
  });
}

/**
 * Delete current user
 * @returns {Promise<{message: string}>}
 */
export async function deleteUser() {
  return http(`/rest/v1/users`, { method: "DELETE" });
}

/**
 * Get list of users by usernames
 * @param {string[]} usernames - Array of usernames
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<UserDto[]>}
 */
export async function getUsersByUsernames(usernames, offset = 0, limit = 20) {
  return http(`/rest/v1/users/userList?offset=${offset}&limit=${limit}`, {
    method: "POST",
    body: JSON.stringify(usernames),
  });
}

/**
 * Follow a user
 * @param {string} toFollowUsername - Username to follow
 * @returns {Promise<{message: string}>}
 */
export async function followUser(toFollowUsername) {
  return http(`/rest/v1/users/follow/${toFollowUsername}`, { method: "POST" });
}

/**
 * Unfollow a user
 * @param {string} toUnfollowUsername - Username to unfollow
 * @returns {Promise<{message: string}>}
 */
export async function unfollowUser(toUnfollowUsername) {
  return http(`/rest/v1/users/unfollow/${toUnfollowUsername}`, { method: "POST" });
}

/**
 * Get followers of a user
 * @param {string} username - Username
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<UserDto[]>}
 */
export async function getFollowers(username, offset = 0, limit = 20) {
  return http(`/rest/v1/users/${username}/followers?offset=${offset}&limit=${limit}`, { method: "GET" });
}

/**
 * Get following of a user
 * @param {string} username - Username
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<UserDto[]>}
 */
export async function getFollowing(username, offset = 0, limit = 20) {
  return http(`/rest/v1/users/${username}/following?offset=${offset}&limit=${limit}`, { method: "GET" });
}

/**
 * Count followers of a user
 * @param {string} username - Username
 * @returns {Promise<number>}
 */
export async function countFollowers(username) {
  return http(`/rest/v1/users/${username}/followers/count`, { method: "GET" });
}

/**
 * Count following of a user
 * @param {string} username - Username
 * @returns {Promise<number>}
 */
export async function countFollowing(username) {
  return http(`/rest/v1/users/${username}/following/count`, { method: "GET" });
}

/**
 * Block a user
 * @param {string} blockedUsername - Username to block
 * @returns {Promise<string>}
 */
export async function blockUser(blockedUsername) {
  return http(`/rest/v1/users/block/${blockedUsername}`, { method: "POST" });
}

/**
 * Unblock a user
 * @param {string} blockedUsername - Username to unblock
 * @returns {Promise<string>}
 */
export async function unblockUser(blockedUsername) {
  return http(`/rest/v1/users/unblock/${blockedUsername}`, { method: "POST" });
}

/**
 * Get blocked users
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<UserDto[]>}
 */
export async function getBlockedUsers(offset = 0, limit = 20) {
  return http(`/rest/v1/users/blocked?offset=${offset}&limit=${limit}`, { method: "GET" });
}

/**
 * Count blocked users
 * @returns {Promise<number>}
 */
export async function countBlockedUsers() {
  return http(`/rest/v1/users/blocked/count`, { method: "GET" });
}

/**
 * Search users by username
 * @param {string} query - Search query (partial username match)
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<UserDto[]>}
 */
export async function searchUsersByUsername(query, offset = 0, limit = 20) {
  return http(`/rest/v1/users/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`, { method: "GET" });
}

