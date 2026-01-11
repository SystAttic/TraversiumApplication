// Notification data service - uses real API
import { getUnseenNotifications, getSeenNotifications } from "../services/notificationApi";
import { getUserById } from "../services/userApi";

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
 * Fetch user display names for Firebase IDs
 */
async function fetchUserDisplayNames(firebaseIds) {
  if (!firebaseIds || firebaseIds.length === 0) return {};
  
  const userMap = {};
  const fetchPromises = firebaseIds.map(async (firebaseId) => {
    try {
      const user = await getUserById(firebaseId);
      if (user) {
        userMap[firebaseId] = user.displayName || user.username || firebaseId;
      }
    } catch (error) {
      console.warn(`Failed to fetch user for ${firebaseId}:`, error);
      userMap[firebaseId] = firebaseId; // Fallback to Firebase ID
    }
  });
  
  await Promise.all(fetchPromises);
  return userMap;
}

/**
 * Generate notification title and body from bundle
 */
function generateNotificationText(bundle, userDisplayNames = {}) {
  const { type, notificationCount, senderIds } = bundle;
  const senderCount = senderIds?.length || 0;
  
  // Get display names for senders
  const getDisplayName = (firebaseId) => {
    return userDisplayNames[firebaseId] || firebaseId;
  };
  
  let title = "";
  let body = "";
  
  switch (type) {
    case "LIKE_PHOTO":
      if (notificationCount === 1) {
        title = "Someone liked your photo";
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} liked your photo` : "Your photo was liked";
      } else {
        title = `${notificationCount} people liked your photo`;
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} and ${notificationCount - 1} others` : `${notificationCount} likes`;
      }
      break;
      
    case "ADD_COMMENT":
    case "REPLY_COMMENT":
      if (notificationCount === 1) {
        title = "New comment on your photo";
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} commented` : "You have a new comment";
      } else {
        title = `${notificationCount} new comments`;
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} and ${notificationCount - 1} others commented` : `${notificationCount} comments`;
      }
      break;
      
    case "FOLLOW_USER":
      if (notificationCount === 1) {
        title = "New follower";
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} started following you` : "You have a new follower";
      } else {
        title = `${notificationCount} new followers`;
        body = senderCount > 0 ? `${getDisplayName(senderIds[0])} and ${notificationCount - 1} others` : `${notificationCount} followers`;
      }
      break;
      
    case "ADD_COLLABORATOR":
      title = "Added as collaborator";
      body = senderCount > 0 ? `You were added as a collaborator by ${getDisplayName(senderIds[0])}` : "You were added as a collaborator";
      break;
      
    case "CREATE_TRIP":
      title = "New trip";
      body = senderCount > 0 ? `${getDisplayName(senderIds[0])} created a trip` : "A new trip was created";
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
  
  // For like/comment notifications, try to navigate to the specific media
  if ((type === "LIKE_PHOTO" || type === "ADD_COMMENT" || type === "REPLY_COMMENT") && collectionReferenceId) {
    // Normalize mediaReferenceIds to array
    let mediaIds = [];
    if (mediaReferenceIds) {
      mediaIds = Array.isArray(mediaReferenceIds) ? mediaReferenceIds : [mediaReferenceIds];
    }
    
    // If we have a moment (nodeReferenceId) and media, navigate to the specific media
    if (nodeReferenceId && mediaIds.length > 0) {
      // Use the first media ID (most recent one that triggered the notification)
      const mediaId = mediaIds[0];
      return `/trips/${collectionReferenceId}/moments/${nodeReferenceId}/media/${mediaId}`;
    }
    // If we have a moment but no specific media, navigate to the moment
    if (nodeReferenceId) {
      return `/trips/${collectionReferenceId}/moments/${nodeReferenceId}`;
    }
    // Otherwise, navigate to the trip
    if (collectionReferenceId) {
      return `/trips/${collectionReferenceId}`;
    }
  }
  
  // For trip-related notifications, navigate to the trip
  if (collectionReferenceId) {
    return `/trips/${collectionReferenceId}`;
  }
  
  // For follow notifications, could navigate to user profile if we had the username
  // For now, just go to home
  return "/(tabs)";
}

/**
 * Transform NotificationBundleDto to UI format
 */
function transformNotification(bundle, userDisplayNames = {}) {
  const mapped = mapNotificationType(bundle.type);
  const { title, body } = generateNotificationText(bundle, userDisplayNames);
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
    let bundles = [];
    let isUnseen = false;
    
    if (page === 0) {
      // First page: get unseen notifications (this marks them as seen)
      bundles = await getUnseenNotifications(0, pageSize);
      isUnseen = true;
      cachedUnseenCount = bundles?.length || 0;
    } else {
      // For subsequent pages, get seen notifications
      // Offset should account for unseen notifications that were marked as seen on first call
      // Formula: offset = (page - 1) * pageSize + cachedUnseenCount
      const offset = (page - 1) * pageSize + cachedUnseenCount;
      bundles = await getSeenNotifications(offset, pageSize);
    }
    
    // Collect all unique sender IDs from all bundles
    const allSenderIds = new Set();
    bundles.forEach((bundle) => {
      if (bundle.senderIds && Array.isArray(bundle.senderIds)) {
        bundle.senderIds.forEach((id) => allSenderIds.add(id));
      }
    });
    
    // Fetch display names for all senders
    const userDisplayNames = await fetchUserDisplayNames(Array.from(allSenderIds));
    
    // Transform notifications with display names
    const items = bundles.map((bundle) => ({
      ...transformNotification(bundle, userDisplayNames),
      read: !isUnseen, // Unseen notifications are unread, seen ones are read
    }));
    
    return {
      items,
      hasMore: bundles.length === pageSize,
      unseenCount: isUnseen ? bundles.length : 0,
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
