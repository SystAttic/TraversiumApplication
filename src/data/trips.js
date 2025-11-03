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
  const events = Array.from({ length: pageSize }, (_, i) => ({
    id: `a${page*pageSize+i+1}`,
    type: ["create_moment","upload_media","delete_moment","invite_user"][i%4],
    text:
      i%4===0 ? "Maja created moment “Café Morning”" :
      i%4===1 ? "Ožbej uploaded 12 photos" :
      i%4===2 ? "Dejan deleted moment “Draft: Lunch”" :
                "Invited @friend to collaborate",
    time: Date.now() - 1000 * 60 * (i + 1 + page*pageSize),
    level: (i%7===0) ? "warning" : (i%11===0 ? "error" : "info"),
  }));
  return { items: events, hasMore: page < 2 };
}
