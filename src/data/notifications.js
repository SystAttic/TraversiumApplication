const TYPES = [
  { type: "like",    icon: "heart",       color: "accent" },
  { type: "comment", icon: "chatbubble",  color: "accent" },
  { type: "follow",  icon: "person-add",  color: "accent" },
  { type: "system",  icon: "information", color: "accent" },
];

function mk(id) {
  const t = TYPES[id % TYPES.length];
  const now = Date.now();
  return {
    id: `n-${id}`,
    type: t.type,
    icon: t.icon,
    title:
      t.type === "like" ? "Someone liked your moment" :
      t.type === "comment" ? "New comment on your trip" :
      t.type === "follow" ? "New follower" :
      "System message",
    body:
      t.type === "comment"
        ? "“Amazing photo from Kyoto!”"
        : t.type === "follow"
        ? "Maja Razinger started following you."
        : t.type === "like"
        ? "Your moment “Sunset over Alps” received 5 likes."
        : "Welcome to Traversium!",
    // Where to go when tapped:
    route:
      t.type === "comment" || t.type === "like"
        ? "/trips/123" : t.type === "follow"
        ? "/users/maja" : "/(tabs)/home",
    createdAt: now - 1000 * 60 * (id + 1),
    read: id % 3 === 0 ? true : false,
  };
}

// In-memory store for now
let ALL = Array.from({ length: 47 }, (_, i) => mk(i + 1));

export async function fetchNotifications({ page = 0, pageSize = 10 } = {}) {
  await new Promise((r) => setTimeout(r, 300));
  const start = page * pageSize;
  const slice = ALL.slice(start, start + pageSize);
  return {
    items: slice,
    hasMore: start + pageSize < ALL.length,
  };
}

export async function markAllRead() {
  ALL = ALL.map((n) => ({ ...n, read: true }));
  return true;
}

export async function clearAllNotifications() {
  await new Promise((r) => setTimeout(r, 250));
  ALL = [];
  return true;
}
