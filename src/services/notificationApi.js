// Notification service API
import { http, NOTIFICATION_SERVICE_BASE } from "./traversiumApi";

/**
 * Get count of unseen notifications
 * @returns {Promise<number>}
 */
export async function getUnseenCount() {
  return http("/rest/v1/notifications/unseen/count", { method: "GET" }, NOTIFICATION_SERVICE_BASE);
}

/**
 * Get unseen notification bundles (marks them as seen when called)
 * @param {number} offset - Pagination offset
 * @param {number} limit - Number of items per page
 * @returns {Promise<NotificationBundleDto[]>}
 */
export async function getUnseenNotifications(offset = 0, limit = 20) {
  return http(
    `/rest/v1/notifications/unseen?offset=${offset}&limit=${limit}`,
    { method: "GET" },
    NOTIFICATION_SERVICE_BASE
  );
}

/**
 * Get seen notification bundles
 * @param {number} offset - Pagination offset (should include count of unseen notifications)
 * @param {number} limit - Number of items per page
 * @returns {Promise<NotificationBundleDto[]>}
 */
export async function getSeenNotifications(offset = 0, limit = 20) {
  return http(
    `/rest/v1/notifications/seen?offset=${offset}&limit=${limit}`,
    { method: "GET" },
    NOTIFICATION_SERVICE_BASE
  );
}
