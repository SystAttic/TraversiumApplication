// TripService API client
import { http, TRIP_SERVICE_BASE } from "./traversiumApi";

/**
 * Get all trips
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<TripDto[]>}
 */
export async function getAllTrips(offset = 0, limit = 20) {
  return http(`/rest/v1/trips?offset=${offset}&limit=${limit}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Get trip by ID
 * @param {number} tripId - Trip ID
 * @returns {Promise<TripDto>}
 */
export async function getTripById(tripId) {
  return http(`/rest/v1/trips/${tripId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Get trips by owner
 * @param {string} ownerId - Owner ID
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<TripDto[]>}
 */
export async function getTripsByOwner(ownerId, offset = 0, limit = 20) {
  return http(`/rest/v1/trips/owner/${ownerId}?offset=${offset}&limit=${limit}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Create a new trip
 * @param {Object} tripDto - TripDto object
 * @returns {Promise<TripDto>}
 */
export async function createTrip(tripDto) {
  return http(`/rest/v1/trips`, {
    method: "POST",
    body: JSON.stringify(tripDto),
  }, TRIP_SERVICE_BASE);
}

/**
 * Update trip
 * @param {Object} tripDto - TripDto object
 * @returns {Promise<TripDto>}
 */
export async function updateTrip(tripDto) {
  return http(`/rest/v1/trips`, {
    method: "PUT",
    body: JSON.stringify(tripDto),
  }, TRIP_SERVICE_BASE);
}

/**
 * Delete trip by ID
 * @param {number} tripId - Trip ID
 * @returns {Promise<void>}
 */
export async function deleteTrip(tripId) {
  return http(`/rest/v1/trips/${tripId}`, { method: "DELETE" }, TRIP_SERVICE_BASE);
}

/**
 * Get trips by collaborator
 * @param {string} collaboratorId - Collaborator ID
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<TripDto[]>}
 */
export async function getTripsByCollaborator(collaboratorId, offset = 0, limit = 20) {
  return http(`/rest/v1/trips/collaborators/${collaboratorId}?offset=${offset}&limit=${limit}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Add collaborator to trip
 * @param {number} tripId - Trip ID
 * @param {string} collaboratorId - Collaborator ID
 * @returns {Promise<TripDto>}
 */
export async function addCollaboratorToTrip(tripId, collaboratorId) {
  return http(`/rest/v1/trips/${tripId}/collaborators/${collaboratorId}`, { method: "PUT" }, TRIP_SERVICE_BASE);
}

/**
 * Remove collaborator from trip
 * @param {number} tripId - Trip ID
 * @param {string} collaboratorId - Collaborator ID
 * @returns {Promise<void>}
 */
export async function removeCollaboratorFromTrip(tripId, collaboratorId) {
  return http(`/rest/v1/trips/${tripId}/collaborators/${collaboratorId}`, { method: "DELETE" }, TRIP_SERVICE_BASE);
}

/**
 * Get viewed trips (trips the current user can view)
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<TripDto[]>}
 */
export async function getTripsByViewer(offset = 0, limit = 20) {
  return http(`/rest/v1/trips/viewers?offset=${offset}&limit=${limit}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Search trips by title
 * @param {string} query - Search query
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<TripDto[]>}
 */
export async function searchTripsByTitle(query, offset = 0, limit = 20) {
  return http(`/rest/v1/trips/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Add viewer to trip
 * @param {number} tripId - Trip ID
 * @param {string} viewerId - Viewer ID
 * @returns {Promise<TripDto>}
 */
export async function addViewerToTrip(tripId, viewerId) {
  return http(`/rest/v1/trips/${tripId}/viewers/${viewerId}`, { method: "PUT" }, TRIP_SERVICE_BASE);
}

/**
 * Remove viewer from trip
 * @param {number} tripId - Trip ID
 * @param {string} viewerId - Viewer ID
 * @returns {Promise<void>}
 */
export async function removeViewerFromTrip(tripId, viewerId) {
  return http(`/rest/v1/trips/${tripId}/viewers/${viewerId}`, { method: "DELETE" }, TRIP_SERVICE_BASE);
}

/**
 * Get album from trip
 * @param {number} tripId - Trip ID
 * @param {number} albumId - Album ID
 * @returns {Promise<AlbumDto>}
 */
export async function getAlbumFromTrip(tripId, albumId) {
  return http(`/rest/v1/trips/${tripId}/albums/${albumId}`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Add album to trip
 * @param {number} tripId - Trip ID
 * @param {Object} albumDto - AlbumDto object
 * @returns {Promise<TripDto>}
 */
export async function addAlbumToTrip(tripId, albumDto) {
  return http(`/rest/v1/trips/${tripId}/albums`, {
    method: "POST",
    body: JSON.stringify(albumDto),
  }, TRIP_SERVICE_BASE);
}

/**
 * Delete album from trip
 * @param {number} tripId - Trip ID
 * @param {number} albumId - Album ID
 * @returns {Promise<void>}
 */
export async function deleteAlbumFromTrip(tripId, albumId) {
  return http(`/rest/v1/trips/${tripId}/albums/${albumId}`, { method: "DELETE" }, TRIP_SERVICE_BASE);
}

/**
 * Get all media from trip
 * @param {number} tripId - Trip ID
 * @returns {Promise<string[]>}
 */
export async function getAllMediaFromTrip(tripId) {
  return http(`/rest/v1/trips/${tripId}/media`, { method: "GET" }, TRIP_SERVICE_BASE);
}

/**
 * Autosort trip media
 * @param {Object} tripDto - TripDto object with media to be autosorted
 * @returns {Promise<TripDto>}
 */
export async function autosortTrip(tripDto) {
  return http(`/rest/v1/trips/autosort`, {
    method: "POST",
    body: JSON.stringify(tripDto),
  }, TRIP_SERVICE_BASE);
}
