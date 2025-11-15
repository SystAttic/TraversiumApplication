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

export async function fetchTripActivity(id, { page = 0, pageSize = 20 } = {}) {
  await new Promise(r => setTimeout(r, 180));
  
  const activityTypes = [
    "UPLOAD", "ARRANGE", "DELETE_MEDIA", "DELETE_MOMENT", 
    "CHANGE_TRIP_INFO", "INVITED_PERSON", "NEW_COLLABORATOR", "NEW_VIEWER"
  ];
  
  const activityTexts = {
    "UPLOAD": ["uploaded 12 photos", "uploaded 5 videos", "uploaded 3 images"],
    "ARRANGE": ["rearranged moments", "organized media", "sorted moments"],
    "DELETE_MEDIA": ["deleted photo", "removed media", "deleted image"],
    "DELETE_MOMENT": ["deleted moment \"Café Morning\"", "removed moment \"Draft: Lunch\"", "deleted moment"],
    "CHANGE_TRIP_INFO": ["changed trip title", "updated description", "modified trip settings"],
    "INVITED_PERSON": ["invited @friend to collaborate", "sent invitation to user", "invited new member"],
    "NEW_COLLABORATOR": ["added new collaborator", "granted edit access", "promoted to collaborator"],
    "NEW_VIEWER": ["added viewer", "granted view access", "added new viewer"],
  };

  const events = Array.from({ length: pageSize }, (_, i) => {
    const typeIndex = i % activityTypes.length;
    const type = activityTypes[typeIndex];
    const textOptions = activityTexts[type];
    const textIndex = Math.floor(i / activityTypes.length) % textOptions.length;
    const userIndex = i % users.length;
    const user = users[userIndex];
    
    return {
      id: `a${page*pageSize+i+1}`,
      type,
      text: `${user.displayName} ${textOptions[textIndex]}`,
      time: Date.now() - 1000 * 60 * (i + 1 + page*pageSize),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };
  });
  
  return { items: events, hasMore: page < 2 };
}
