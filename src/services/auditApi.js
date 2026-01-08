// AuditService API client
import { http, AUDIT_SERVICE_BASE } from "./traversiumApi";

/**
 * Get trip activities
 * @param {number} tripId - Trip ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 0)
 * @param {number} params.size - Page size (default: 20)
 * @param {string} params.action - Optional action filter
 * @param {string} params.startTime - Optional start time (ISO 8601)
 * @param {string} params.endTime - Optional end time (ISO 8601)
 * @returns {Promise<{content: TripActivity[], totalElements: number, totalPages: number, size: number, number: number, hasMore: boolean}>}
 */
export async function getTripActivities(tripId, { page = 0, size = 20, action = null, startTime = null, endTime = null } = {}) {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (action) params.append("action", action);
  if (startTime) params.append("startTime", startTime);
  if (endTime) params.append("endTime", endTime);

  const response = await http(`/api/audit/trip/${tripId}/activities?${params.toString()}`, { method: "GET" }, AUDIT_SERVICE_BASE);
  
  // Transform Spring Page response to match frontend expectations
  return {
    content: response.content || [],
    totalElements: response.totalElements || 0,
    totalPages: response.totalPages || 0,
    size: response.size || size,
    number: response.number || page,
    hasMore: !response.last,
  };
}

/**
 * Get recent trip activity
 * @param {number} tripId - Trip ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<TripActivity[]>}
 */
export async function getRecentTripActivity(tripId, days = 7) {
  return http(`/api/audit/trip/${tripId}/recent-activity?days=${days}`, { method: "GET" }, AUDIT_SERVICE_BASE);
}

