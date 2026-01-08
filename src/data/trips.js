// Trips catalogue with visibility + editors
// visibility: "private" | "public"
export const trips = [
  {
    id: "alps-2025",
    title: "Swiss Alps",
    subtitle: "Zermatt • Apr 2025",
    cover:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    contributors: ["ozbej", "dejan", "jure"],
    editors: ["ozbej", "dejan"],
    visibility: "public",
    tags: ["mountains", "switzerland", "hiking"],
  },
  {
    id: "seoul-2024",
    title: "Seoul Autumn",
    subtitle: "South Korea • Oct 2024",
    cover:
      "https://images.unsplash.com/photo-1549693578-d683be217e58?q=80&w=1600&auto=format&fit=crop",
    contributors: ["ozbej", "maja"],
    editors: ["ozbej"],
    visibility: "public",
    tags: ["asia", "food", "city"],
  },
  {
    id: "croatia-2023",
    title: "Istria Coast",
    subtitle: "Croatia • Aug 2023",
    cover:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1600&auto=format&fit=crop",
    contributors: ["ozbej"],
    editors: ["ozbej"],
    visibility: "private",
    tags: ["beach", "summer"],
  },
];


// src/data/trips.js
const users = [
  { id: "u1", username: "ozbej", displayName: "Ožbej Pavc", avatar: "https://i.pravatar.cc/100?img=64" },
  { id: "u2", username: "maja",  displayName: "Maja Razinger", avatar: "https://i.pravatar.cc/100?img=36" },
  { id: "u3", username: "dejan", displayName: "Dejan Jarc",    avatar: "https://i.pravatar.cc/100?img=20" },
];

const media = Array.from({ length: 48 }, (_, i) => ({
  id: `m${i+1}`,
  uri: `https://picsum.photos/seed/trv-${i+1}/${(i%3===0)?640:480}/${(i%2===0)?480:640}`,
  w: (i%3===0)?640:480,
  h: (i%2===0)?480:640,
  uploader: users[i % users.length].id, // Assign uploader from users array
  createdAt: Date.now() - (i * 1000 * 60 * 60 * 2), // Stagger timestamps (2 hours apart)
}));

const moments = [
  {
    id: "mo1",
    title: "Café Morning",
    description: "Cappuccinos & croissants",
    coverUri: media[1].uri,
    mediaIds: media.slice(0, 8).map(m => m.id),
    createdBy: "u2",
    createdAt: Date.now()-1000*60*60*48,
  },
  {
    id: "mo2",
    title: "Tower of Pisa",
    description: "Leaning legends & group shots",
    coverUri: media[14].uri,
    mediaIds: media.slice(8, 22).map(m => m.id),
    createdBy: "u1",
    createdAt: Date.now()-1000*60*60*38,
  },
  {
    id: "mo3",
    title: "Drive Home",
    description: "Highways and sunsets",
    coverUri: media[30].uri,
    mediaIds: media.slice(22, 48).map(m => m.id),
    createdBy: "u3",
    createdAt: Date.now()-1000*60*60*24,
  },
];

const trip = {
  id: "t1",
  title: "Tuscany Weekend",
  description: "Friends, food, and architecture.",
  coverUri: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1600",
  collaborators: [users[0], users[1], users[2]],
  visibility: "private", // "private" | "public"
  media, moments,
  stats: { moments: moments.length, media: media.length },
};

export async function fetchTripById(id, { me = "u1" } = {}) {
  // Small delay to simulate network
  await new Promise(r => setTimeout(r, 250));
  const isCollaborator = trip.collaborators.some(c => c.id === me);
  const isViewer = !isCollaborator; // in real app, check invite/visibility
  return { ...trip, isCollaborator, isViewer };
}

import { getTripActivities } from "../services/auditApi";
import { getUserById } from "../services/userApi";
import { getMediaFileUrl } from "../services/fileStorageApi";

/**
 * Maps backend action to frontend activity type
 */
function mapActionToType(action) {
  const actionUpper = action.toUpperCase();
  
  // Media actions
  if (actionUpper === "MEDIA_UPLOADED" || actionUpper === "MEDIA_ASSIGNED_TO_ALBUM") {
    return "UPLOAD";
  }
  if (actionUpper === "MEDIA_DELETED" || actionUpper === "MEDIA_UNASSIGNED_FROM_ALBUM") {
    return "DELETE_MEDIA";
  }
  
  // Album/Moment actions (albums are moments in the frontend)
  if (actionUpper === "ALBUM_CREATED") {
    return "ARRANGE"; // Creating a moment/album is like arranging
  }
  if (actionUpper === "ALBUM_DELETED") {
    return "DELETE_MOMENT";
  }
  if (actionUpper === "ALBUMS_REORDERED" || actionUpper === "ALBUM_INFO_CHANGED") {
    return "ARRANGE";
  }
  
  // Trip info changes
  if (actionUpper.includes("TRIP_") && (actionUpper.includes("CHANGED") || actionUpper.includes("INFO"))) {
    return "CHANGE_TRIP_INFO";
  }
  
  // Collaborator actions
  if (actionUpper === "TRIP_COLLABORATOR_INVITED") {
    return "INVITED_PERSON";
  }
  if (actionUpper === "TRIP_COLLABORATOR_JOINED") {
    return "NEW_COLLABORATOR";
  }
  if (actionUpper === "TRIP_COLLABORATOR_REMOVED") {
    return "DELETE_MEDIA"; // Use delete icon for removal
  }
  
  // Viewer actions
  if (actionUpper === "TRIP_VIEWER_INVITED") {
    return "INVITED_PERSON";
  }
  if (actionUpper === "TRIP_VIEWER_JOINED") {
    return "NEW_VIEWER";
  }
  if (actionUpper === "TRIP_VIEWER_REMOVED") {
    return "DELETE_MEDIA"; // Use delete icon for removal
  }
  
  // Default fallback
  return "UPLOAD";
}

/**
 * Generates human-readable text from activity action and metadata
 */
function generateActivityText(action, metadata, entityType) {
  const actionUpper = action.toUpperCase();
  let metadataObj = null;
  
  try {
    metadataObj = metadata ? JSON.parse(metadata) : null;
  } catch (e) {
    // Metadata might already be an object or invalid JSON
    metadataObj = typeof metadata === "object" ? metadata : null;
  }
  
  // Media actions
  if (actionUpper === "MEDIA_UPLOADED") {
    const count = metadataObj?.count || metadataObj?.mediaCount || 1;
    const type = count === 1 ? "photo" : "photos";
    return `uploaded ${count} ${type}`;
  }
  if (actionUpper === "MEDIA_DELETED") {
    return "deleted media";
  }
  if (actionUpper === "MEDIA_ASSIGNED_TO_ALBUM") {
    const albumTitle = metadataObj?.albumTitle || "moment";
    return `added media to "${albumTitle}"`;
  }
  if (actionUpper === "MEDIA_UNASSIGNED_FROM_ALBUM") {
    return "removed media from moment";
  }
  
  // Album/Moment actions
  if (actionUpper === "ALBUM_CREATED") {
    const title = metadataObj?.title || metadataObj?.albumTitle || "moment";
    return `created moment "${title}"`;
  }
  if (actionUpper === "ALBUM_DELETED") {
    const title = metadataObj?.title || metadataObj?.albumTitle || "moment";
    return `deleted moment "${title}"`;
  }
  if (actionUpper === "ALBUMS_REORDERED") {
    return "rearranged moments";
  }
  if (actionUpper === "ALBUM_TITLE_CHANGED") {
    const newTitle = metadataObj?.newTitle || metadataObj?.title;
    return newTitle ? `renamed moment to "${newTitle}"` : "changed moment title";
  }
  if (actionUpper === "ALBUM_DESCRIPTION_CHANGED") {
    return "updated moment description";
  }
  if (actionUpper === "ALBUM_INFO_CHANGED") {
    return "updated moment";
  }
  
  // Trip info changes
  if (actionUpper === "TRIP_NAME_CHANGED" || actionUpper === "TRIP_TITLE_CHANGED") {
    const newTitle = metadataObj?.newTitle || metadataObj?.title;
    return newTitle ? `changed trip title to "${newTitle}"` : "changed trip title";
  }
  if (actionUpper === "TRIP_DESCRIPTION_CHANGED") {
    return "updated trip description";
  }
  if (actionUpper === "TRIP_COVER_PHOTO_CHANGED") {
    return "changed trip cover photo";
  }
  if (actionUpper === "TRIP_VISIBILITY_CHANGED") {
    const visibility = metadataObj?.visibility || metadataObj?.newVisibility;
    return visibility ? `changed trip visibility to ${visibility.toLowerCase()}` : "changed trip visibility";
  }
  if (actionUpper === "TRIP_INFO_CHANGED") {
    return "updated trip info";
  }
  
  // Collaborator actions
  if (actionUpper === "TRIP_COLLABORATOR_INVITED") {
    const username = metadataObj?.username || metadataObj?.collaboratorUsername;
    return username ? `invited @${username} to collaborate` : "invited collaborator";
  }
  if (actionUpper === "TRIP_COLLABORATOR_JOINED") {
    const username = metadataObj?.username || metadataObj?.collaboratorUsername;
    return username ? `@${username} joined as collaborator` : "new collaborator joined";
  }
  if (actionUpper === "TRIP_COLLABORATOR_REMOVED") {
    const username = metadataObj?.username || metadataObj?.collaboratorUsername;
    return username ? `removed @${username} as collaborator` : "removed collaborator";
  }
  
  // Viewer actions
  if (actionUpper === "TRIP_VIEWER_INVITED") {
    const username = metadataObj?.username || metadataObj?.viewerUsername;
    return username ? `invited @${username} to view` : "invited viewer";
  }
  if (actionUpper === "TRIP_VIEWER_JOINED") {
    const username = metadataObj?.username || metadataObj?.viewerUsername;
    return username ? `@${username} joined as viewer` : "new viewer joined";
  }
  if (actionUpper === "TRIP_VIEWER_REMOVED") {
    const username = metadataObj?.username || metadataObj?.viewerUsername;
    return username ? `removed @${username} as viewer` : "removed viewer";
  }
  
  // Trip lifecycle
  if (actionUpper === "TRIP_CREATED") {
    return "created trip";
  }
  if (actionUpper === "TRIP_DELETED") {
    return "deleted trip";
  }
  
  // Default fallback
  return action.replace(/_/g, " ").toLowerCase();
}

/**
 * Fetches user information by Firebase ID
 * Returns a user object with fallback values if fetch fails
 * Note: getUserById accepts Firebase ID since user ID and Firebase ID are the same
 */
async function fetchUserInfo(firebaseId) {
  try {
    const user = await getUserById(firebaseId);
    return {
      id: firebaseId,
      username: user.username || firebaseId,
      displayName: user.displayName || user.firstName || user.username || firebaseId,
      avatar: user.avatarPhotoReference ? getMediaFileUrl(user.avatarPhotoReference) : null,
    };
  } catch (error) {
    console.warn(`Failed to fetch user info for ${firebaseId}:`, error);
    // Return fallback user object on error
    return {
      id: firebaseId,
      username: firebaseId,
      displayName: firebaseId,
      avatar: null,
    };
  }
}

/**
 * Fetches trip activity from AuditService
 */
export async function fetchTripActivity(id, { page = 0, pageSize = 20 } = {}) {
  try {
    const tripIdNum = Number(id);
    if (!tripIdNum || isNaN(tripIdNum)) {
      throw new Error(`Invalid trip ID: ${id}`);
    }
    
    // Fetch activities from AuditService
    const response = await getTripActivities(tripIdNum, { page, size: pageSize });
    
    // Fetch user info for all unique user IDs
    const userIds = [...new Set(response.content.map(activity => activity.userId))];
    const userMap = new Map();
    
    // Fetch user info in parallel (with error handling)
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userInfo = await fetchUserInfo(userId);
          userMap.set(userId, userInfo);
        } catch (error) {
          console.warn(`Failed to fetch user ${userId}:`, error);
          userMap.set(userId, {
            id: userId,
            username: userId,
            displayName: userId,
            avatar: null,
          });
        }
      })
    );
    
    // Transform activities to frontend format
    const items = response.content.map((activity) => {
      const type = mapActionToType(activity.action);
      const text = generateActivityText(activity.action, activity.metadata, activity.entityType);
      const user = userMap.get(activity.userId) || {
        id: activity.userId,
        username: activity.userId,
        displayName: activity.userId,
        avatar: null,
      };
      
      // Convert ISO timestamp to milliseconds
      const time = activity.timestamp ? new Date(activity.timestamp).getTime() : Date.now();
      
      return {
        id: String(activity.activityId || `activity-${activity.timestamp}-${activity.action}`),
        type,
        text,
        time,
        user,
        // Include raw data for debugging/future use
        raw: {
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          metadata: activity.metadata,
        },
      };
    });
    
    return {
      items,
      hasMore: response.hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch trip activity:", error);
    // Return empty result on error
    return {
      items: [],
      hasMore: false,
    };
  }
}
