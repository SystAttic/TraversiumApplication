// MediaService API client
import { http, TRIP_SERVICE_BASE } from "./traversiumApi";

/**
 * Get all media
 * @returns {Promise<MediaDto[]>}
 */
export async function getAllMedia() {
  return http(`/rest/v1/media`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Get media by ID
 * @param {number} mediaId - Media ID
 * @returns {Promise<MediaDto>}
 */
export async function getMediaById(mediaId) {
  return http(`/rest/v1/media/${mediaId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Get media by uploader
 * @param {string} uploaderId - Uploader ID
 * @returns {Promise<MediaDto[]>}
 */
export async function getMediaByUploader(uploaderId) {
  return http(`/rest/v1/media/uploader/${uploaderId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

