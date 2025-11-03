// Simple in-memory mocks for now.
const mockUsers = [
  { id: 1, username: "maja", displayName: "Maja Razinger", isFollowing: true },
  { id: 2, username: "dejan", displayName: "Dejan Jarc", isFollowing: false },
  { id: 3, username: "jure", displayName: "Jure Zupančič", isFollowing: true },
  { id: 4, username: "ozbej", displayName: "Ožbej Pavc", isFollowing: false },
];

let followers = [mockUsers[0], mockUsers[1]];
let following = [mockUsers[2], mockUsers[3]];
let blocked = [mockUsers[1]];

export async function fetchFollowers() {
  await new Promise((r) => setTimeout(r, 150));
  return followers;
}
export async function fetchFollowing() {
  await new Promise((r) => setTimeout(r, 150));
  return following;
}
export async function fetchBlocked() {
  await new Promise((r) => setTimeout(r, 150));
  return blocked;
}

export async function toggleFollow(user) {
  await new Promise((r) => setTimeout(r, 120));
  user.isFollowing = !user.isFollowing;
  if (user.isFollowing) {
    if (!following.find((u) => u.username === user.username)) following.push(user);
  } else {
    following = following.filter((u) => u.username !== user.username);
  }
  return user.isFollowing;
}

export async function unblockUser(user) {
  await new Promise((r) => setTimeout(r, 120));
  blocked = blocked.filter((u) => u.username !== user.username);
  return true;
}
