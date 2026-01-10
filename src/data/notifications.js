// Notification data service - uses real API
import { getUnseenNotifications, getSeenNotifications } from "../services/notificationApi";

/**
 * Map notification type to UI-friendly format
 */
function mapNotificationType(type) {
  const typeMap = {
    LIKE_PHOTO: { type: "like", icon: "heart" },
    ADD_COMMENT: { type: "comment", icon: "chatbubble-ellipses" },
    REPLY_COMMENT: { type: "comment", icon: "chatbubble-ellipses" },
    FOLLOW_USER: { type: "follow", icon: "person-add" },
    CREATE_TRIP: { type: "system", icon: "albums" },
    DELETE_TRIP: { type: "system", icon: "albums" },
    CHANGE_TRIP_TITLE: { type: "system", icon: "albums" },
    CHANGE_TRIP_DESCRIPTION: { type: "system", icon: "albums" },
    CHANGE_TRIP_COVER_PHOTO: { type: "system", icon: "albums" },
    CHANGE_TRIP_VISIBILITY: { type: "system", icon: "albums" },
    ADD_COLLABORATOR: { type: "system", icon: "people" },
    REMOVE_COLLABORATOR: { type: "system", icon: "people" },
    ADD_VIEWER: { type: "system", icon: "eye" },
    REMOVE_VIEWER: { type: "system", icon: "eye" },
    CREATE_MOMENT: { type: "system", icon: "image" },
    DELETE_MOMENT: { type: "system", icon: "image" },
    CHANGE_MOMENT_TITLE: { type: "system", icon: "image" },
    CHANGE_MOMENT_DESCRIPTION: { type: "system", icon: "image" },
    CHANGE_MOMENT_COVER_PHOTO: { type: "system", icon: "image" },
    REARRANGE_MOMENTS: { type: "system", icon: "swap-vertical" },
    ADD_PHOTO: { type: "system", icon: "image" },
    REMOVE_PHOTO: { type: "system", icon: "image" },
  };
  
  return typeMap[type] || { type: "system", icon: "information-circle" };
}

/**
 * Generate notification title and body from bundle
 */
function generateNotificationText(bundle) {
  const { type, notificationCount, senderIds } = bundle;
  const senderCount = senderIds?.length || 0;
  
  let title = "";
  let body = "";
  
  switch (type) {
    case "LIKE_PHOTO":
      if (notificationCount === 1) {
        title = "Someone liked your photo";
        body = senderCount > 0 ? `${senderIds[0]} liked your photo` : "Your photo was liked";
      } else {
        title = `${notificationCount} people liked your photo`;
        body = senderCount > 0 ? `${senderIds[0]} and ${notificationCount - 1} others` : `${notificationCount} likes`;
      }
      break;
      
    case "ADD_COMMENT":
    case "REPLY_COMMENT":
      if (notificationCount === 1) {
        title = "New comment on your photo";
        body = senderCount > 0 ? `${senderIds[0]} commented` : "You have a new comment";
      } else {
        title = `${notificationCount} new comments`;
        body = senderCount > 0 ? `${senderIds[0]} and ${notificationCount - 1} others commented` : `${notificationCount} comments`;
      }
      break;
      
    case "FOLLOW_USER":
      if (notificationCount === 1) {
        title = "New follower";
        body = senderCount > 0 ? `${senderIds[0]} started following you` : "You have a new follower";
      } else {
        title = `${notificationCount} new followers`;
        body = senderCount > 0 ? `${senderIds[0]} and ${notificationCount - 1} others` : `${notificationCount} followers`;
      }
      break;
      
    case "ADD_COLLABORATOR":
      title = "Added as collaborator";
      body = senderCount > 0 ? `You were added as a collaborator by ${senderIds[0]}` : "You were added as a collaborator";
      break;
      
    case "CREATE_TRIP":
      title = "New trip";
      body = senderCount > 0 ? `${senderIds[0]} created a trip` : "A new trip was created";
      break;
      
    default:
      title = "Notification";
      body = `You have ${notificationCount} new notification${notificationCount > 1 ? "s" : ""}`;
  }
  
  return { title, body };
}

/**
 * Generate route from notification bundle
 */
function generateRoute(bundle) {
  const { type, collectionReferenceId, nodeReferenceId, mediaReferenceIds } = bundle;
  
  if (collectionReferenceId) {
    return `/trips/${collectionReferenceId}`;
  }
  
  if (mediaReferenceIds) {
    // Could navigate to specific photo if needed
    return collectionReferenceId ? `/trips/${collectionReferenceId}` : "/(tabs)";
  }
  
  return "/(tabs)";
}

/**
 * Transform NotificationBundleDto to UI format
 */
function transformNotification(bundle) {
  const mapped = mapNotificationType(bundle.type);
  const { title, body } = generateNotificationText(bundle);
  const route = generateRoute(bundle);
  
  // Use lastTimestamp as createdAt (most recent notification in bundle)
  const createdAt = new Date(bundle.lastTimestamp).getTime();
  
  return {
    id: bundle.bundleId,
    type: mapped.type,
    icon: mapped.icon,
    title,
    body,
    route,
    createdAt,
    read: false, // Unseen notifications are unread, seen ones are read
    bundle, // Keep original bundle data for reference
  };
}

// Store unseen count from first call to use for pagination
let cachedUnseenCount = 0;

/**
 * Fetch notifications with proper pagination
 * @param {Object} options - { page, pageSize }
 * @returns {Promise<{items: Array, hasMore: boolean, unseenCount: number}>}
 */
export async function fetchNotifications({ page = 0, pageSize = 10 } = {}) {
  try {
    if (page === 0) {
      // First page: get unseen notifications (this marks them as seen)
      const unseen = await getUnseenNotifications(0, pageSize);
      const unseenCount = unseen?.length || 0;
      cachedUnseenCount = unseenCount;
      
      // Transform unseen notifications
      const unseenItems = unseen.map(transformNotification);
      
      return {
        items: unseenItems,
        hasMore: unseenCount === pageSize, // More if we got a full page
        unseenCount,
      };
    }
    
    // For subsequent pages, get seen notifications
    // Offset should account for unseen notifications that were marked as seen on first call
    // Formula: offset = (page - 1) * pageSize + cachedUnseenCount
    const offset = (page - 1) * pageSize + cachedUnseenCount;
    const seen = await getSeenNotifications(offset, pageSize);
    const seenItems = seen.map((bundle) => ({
      ...transformNotification(bundle),
      read: true, // Seen notifications are read
    }));
    
    return {
      items: seenItems,
      hasMore: seen.length === pageSize,
      unseenCount: 0, // No unseen on subsequent pages
    };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read (no-op since calling unseen marks them as seen)
 */
export async function markAllRead() {
  // Calling getUnseenNotifications marks them as seen, so we just need to fetch them
  try {
    await getUnseenNotifications(0, 1000); // Fetch all unseen to mark them as seen
    return true;
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return false;
  }
}

/**
 * Clear all notifications (not supported by API, but kept for compatibility)
 */
export async function clearAllNotifications() {
  // API doesn't support clearing, so this is a no-op
  console.warn("clearAllNotifications is not supported by the API");
  return true;
}
