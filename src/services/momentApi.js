// MomentService API client (Albums are called Moments in the frontend)
import { http, TRIP_SERVICE_BASE } from "./traversiumApi";

/**
 * Get all albums (moments)
 * @returns {Promise<AlbumDto[]>}
 */
export async function getAllAlbums() {
  return http(`/rest/v1/albums`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Get album by ID
 * @param {number} albumId - Album ID
 * @returns {Promise<AlbumDto>}
 */
export async function getAlbumById(albumId) {
  return http(`/rest/v1/albums/${albumId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Update album
 * @param {number} albumId - Album ID
 * @param {Object} albumDto - AlbumDto object
 * @returns {Promise<AlbumDto>}
 */
export async function updateAlbum(albumId, albumDto) {
  return http(`/rest/v1/albums/${albumId}`, {
    method: "PUT",
    body: JSON.stringify(albumDto),
  }, TRIP_SERVICE_BASE);
}

/**
 * Get media from album
 * @param {number} albumId - Album ID
 * @param {number} mediaId - Media ID
 * @returns {Promise<MediaDto>}
 */
export async function getMediaFromAlbum(albumId, mediaId) {
  return http(`/rest/v1/albums/${albumId}/media/${mediaId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Add media to album
 * @param {number} albumId - Album ID
 * @param {Object|Object[]} mediaDto - MediaDto object or array of MediaDto objects
 * @returns {Promise<AlbumDto>}
 */
export async function addMediaToAlbum(albumId, mediaDto) {
  // Backend expects a list, so wrap single object in array if needed
  const mediaDtos = Array.isArray(mediaDto) ? mediaDto : [mediaDto];
  return http(`/rest/v1/albums/${albumId}/media`, {
    method: "PUT",
    body: JSON.stringify(mediaDtos),
  }, TRIP_SERVICE_BASE);
}

/**
 * Delete media from album
 * @param {number} albumId - Album ID
 * @param {number} mediaId - Media ID
 * @returns {Promise<void>}
 */
export async function deleteMediaFromAlbum(albumId, mediaId) {
  return http(`/rest/v1/albums/${albumId}/media/${mediaId}`, { method: "DELETE" }, TRIP_SERVICE_BASE);
}

