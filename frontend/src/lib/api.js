import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Users
  registerUser: (name, handle) => request('/users/register', { method: 'POST', body: JSON.stringify({ name, handle }) }),
  getUser: (uid) => request(`/users/${uid}`),
  getUserByHandle: (handle) => request(`/users/by-handle/${handle}`),
  updateMe: (updates) => request('/users/me', { method: 'PATCH', body: JSON.stringify(updates) }),
  followUser: (uid) => request(`/users/${uid}/follow`, { method: 'POST' }),
  muteUser: (uid) => request(`/users/${uid}/mute`, { method: 'POST' }),
  blockUser: (uid) => request(`/users/${uid}/block`, { method: 'POST' }),
  getFollowers: (uid) => request(`/users/${uid}/followers`),
  getFollowing: (uid) => request(`/users/${uid}/following`),
  getSuggestions: () => request('/users/me/suggestions'),
  getBookmarks: () => request('/users/me/bookmarks'),
  toggleBookmark: (uid, postId) => request(`/users/${uid}/bookmark/${postId}`, { method: 'POST' }),
  createList: (name, memberUids) => request('/users/me/lists', { method: 'POST', body: JSON.stringify({ name, memberUids }) }),
  getLists: () => request('/users/me/lists'),
  updateList: (listId, body) => request(`/users/me/lists/${listId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Posts
  createPost: (payload) => request('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  getPost: (id) => request(`/posts/${id}`),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  repostPost: (id) => request(`/posts/${id}/repost`, { method: 'POST' }),
  commentOnPost: (id, text) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  getComments: (id) => request(`/posts/${id}/comments`),
  votePoll: (id, optionIndex) => request(`/posts/${id}/poll/vote`, { method: 'POST', body: JSON.stringify({ optionIndex }) }),
  getPostAnalytics: (id) => request(`/posts/${id}/analytics`),
  getUserPosts: (uid, cursor) => request(`/posts/user/${uid}${cursor ? `?cursor=${cursor}` : ''}`),
  getHashtagPosts: (tag) => request(`/posts/hashtag/${tag}`),

  // Feed
  getGlobalFeed: (cursor) => request(`/feed/global${cursor ? `?cursor=${cursor}` : ''}`),
  getFollowingFeed: (cursor) => request(`/feed/following${cursor ? `?cursor=${cursor}` : ''}`),
  getForYouFeed: () => request('/feed/for-you'),
  getListFeed: (listId) => request(`/feed/lists/${listId}`),

  // Notifications
  getNotifications: (cursor) => request(`/notifications${cursor ? `?cursor=${cursor}` : ''}`),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationsRead: () => request('/notifications/mark-read', { method: 'POST' }),

  // Search
  search: (q, type = 'all') => request(`/search?q=${encodeURIComponent(q)}&type=${type}`),

  // Trending
  getTrending: () => request('/trending'),

  // Messages
  getConversations: () => request('/messages/conversations'),
  getMessages: (otherUid) => request(`/messages/${otherUid}`),
  sendMessage: (otherUid, text) => request(`/messages/${otherUid}`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Upload
  uploadImage: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/upload/image', { method: 'POST', body: fd });
  },
  uploadAvatar: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('/upload/avatar', { method: 'POST', body: fd });
  },

  // Link preview
  getLinkPreview: (url) => request(`/link-preview?url=${encodeURIComponent(url)}`),
};
