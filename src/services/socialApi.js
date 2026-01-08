// SocialService API client
import { http, SOCIAL_SERVICE_BASE } from "./traversiumApi";

/**
 * Like a media item
 * @param {number} mediaId - Media ID
 * @returns {Promise<LikeDto>}
 */
export async function likeMedia(mediaId) {
  return http(`/rest/v1/media/${mediaId}/likes`, { method: "POST" }, SOCIAL_SERVICE_BASE);
}

/**
 * Unlike a media item
 * @param {number} mediaId - Media ID
 * @returns {Promise<void>}
 */
export async function unlikeMedia(mediaId) {
  return http(`/rest/v1/media/${mediaId}/likes`, { method: "DELETE" }, SOCIAL_SERVICE_BASE);
}

/**
 * Get like count for a media item
 * @param {number} mediaId - Media ID
 * @returns {Promise<LikeCountDto>} - { mediaId, likeCount, isLiked }
 */
export async function getLikeCount(mediaId) {
  return http(`/rest/v1/media/${mediaId}/likes`, { method: "GET" }, SOCIAL_SERVICE_BASE);
}

/**
 * Check if current user has liked a media item
 * @param {number} mediaId - Media ID
 * @returns {Promise<boolean>}
 */
export async function checkIfLiked(mediaId) {
  return http(`/rest/v1/media/${mediaId}/likes/check`, { method: "GET" }, SOCIAL_SERVICE_BASE);
}

/**
 * Create a comment on a media item
 * @param {number} mediaId - Media ID
 * @param {Object} createCommentDto - { content: string, parentId?: number }
 * @returns {Promise<CommentDto>}
 */
export async function createComment(mediaId, createCommentDto) {
  return http(`/rest/v1/media/${mediaId}/comments`, {
    method: "POST",
    body: JSON.stringify(createCommentDto),
  }, SOCIAL_SERVICE_BASE);
}

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {Object} updateCommentDto - { content: string }
 * @returns {Promise<CommentDto>}
 */
export async function updateComment(commentId, updateCommentDto) {
  return http(`/rest/v1/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify(updateCommentDto),
  }, SOCIAL_SERVICE_BASE);
}

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<void>}
 */
export async function deleteComment(commentId) {
  return http(`/rest/v1/comments/${commentId}`, { method: "DELETE" }, SOCIAL_SERVICE_BASE);
}

/**
 * Get comments for a media item (paginated)
 * @param {number} mediaId - Media ID
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Page<CommentDto>>} - { content: CommentDto[], totalElements, totalPages, etc. }
 */
export async function getComments(mediaId, page = 0, size = 20) {
  return http(`/rest/v1/media/${mediaId}/comments?page=${page}&size=${size}`, { method: "GET" }, SOCIAL_SERVICE_BASE);
}

/**
 * Get replies for a comment (paginated)
 * @param {number} commentId - Comment ID
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Page<CommentDto>>}
 */
export async function getCommentReplies(commentId, page = 0, size = 20) {
  return http(`/rest/v1/comments/${commentId}/replies?page=${page}&size=${size}`, { method: "GET" }, SOCIAL_SERVICE_BASE);
}

/**
 * Get a specific comment by ID
 * @param {number} commentId - Comment ID
 * @returns {Promise<CommentDto>}
 */
export async function getComment(commentId) {
  return http(`/rest/v1/comments/${commentId}`, { method: "GET" }, SOCIAL_SERVICE_BASE);
}

