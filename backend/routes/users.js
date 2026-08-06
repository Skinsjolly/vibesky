const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../services/firebase');
const { requireAuth, verifyToken } = require('../middleware/auth');

// GET /api/users/by-handle/:handle — lookup by handle (for /u/:handle routes)
router.get('/by-handle/:handle', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('users').where('handle', '==', req.params.handle.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'User not found' });
    const doc = snap.docs[0];
    const { email, ...safe } = doc.data();
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:uid — get any user profile
router.get('/:uid', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const u = doc.data();
    // Don't expose private fields
    const { email, ...safe } = u;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/users/me — update own profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, handle, bio, avatar, pinnedPostId } = req.body;
    const updates = {};
    if (name !== undefined)        updates.name = name.trim().slice(0, 60);
    if (handle !== undefined)      updates.handle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0, 30);
    if (bio !== undefined)         updates.bio = bio.trim().slice(0, 300);
    if (avatar !== undefined)      updates.avatar = avatar;
    if (pinnedPostId !== undefined) updates.pinnedPostId = pinnedPostId;
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields to update' });
    await db.collection('users').doc(req.uid).update(updates);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/me/bookmarks
router.get('/me/bookmarks', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.uid)
      .collection('bookmarks').orderBy('createdAt','desc').limit(50).get();
    const postIds = [];
    snap.forEach(d => postIds.push(d.id));
    if (!postIds.length) return res.json([]);
    // Fetch actual posts
    const posts = await Promise.all(postIds.map(async id => {
      const d = await db.collection('posts').doc(id).get();
      return d.exists ? { id: d.id, ...d.data() } : null;
    }));
    res.json(posts.filter(Boolean));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/:uid/bookmark/:postId
router.post('/:uid/bookmark/:postId', requireAuth, async (req, res) => {
  try {
    const ref = db.collection('users').doc(req.uid).collection('bookmarks').doc(req.params.postId);
    const existing = await ref.get();
    if (existing.exists) {
      await ref.delete();
      return res.json({ bookmarked: false });
    }
    await ref.set({ createdAt: FieldValue.serverTimestamp() });
    res.json({ bookmarked: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/:uid/follow — follow or unfollow
router.post('/:uid/follow', requireAuth, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    if (targetUid === req.uid) return res.status(400).json({ error: 'Cannot follow yourself' });
    const myRef     = db.collection('users').doc(req.uid);
    const theirRef  = db.collection('users').doc(targetUid);
    const me        = (await myRef.get()).data();
    const following = me.following || [];
    const isFollowing = following.includes(targetUid);
    if (isFollowing) {
      await myRef.update({ following: FieldValue.arrayRemove(targetUid) });
      await theirRef.update({ followers: FieldValue.arrayRemove(req.uid) });
    } else {
      await myRef.update({ following: FieldValue.arrayUnion(targetUid) });
      await theirRef.update({ followers: FieldValue.arrayUnion(req.uid) });
      // Notification
      await db.collection('notifications').add({
        targetUid, type: 'follow',
        actorUid: req.uid, actorName: me.name, actorAvatar: me.avatar || '',
        text: `<strong>${me.name}</strong> followed you`,
        read: false, createdAt: FieldValue.serverTimestamp()
      });
    }
    res.json({ following: !isFollowing });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:uid/followers
router.get('/:uid/followers', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const followers = doc.data().followers || [];
    const users = await Promise.all(followers.slice(0, 50).map(async uid => {
      const d = await db.collection('users').doc(uid).get();
      if (!d.exists) return null;
      const { email, ...safe } = d.data();
      return safe;
    }));
    res.json(users.filter(Boolean));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:uid/following
router.get('/:uid/following', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const following = doc.data().following || [];
    const users = await Promise.all(following.slice(0, 50).map(async uid => {
      const d = await db.collection('users').doc(uid).get();
      if (!d.exists) return null;
      const { email, ...safe } = d.data();
      return safe;
    }));
    res.json(users.filter(Boolean));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:uid/suggestions — who to follow
router.get('/me/suggestions', requireAuth, async (req, res) => {
  try {
    const me = req.user;
    const following = me.following || [];
    const excluded = [...following, req.uid];
    const snap = await db.collection('users').orderBy('createdAt','desc').limit(30).get();
    const suggestions = [];
    snap.forEach(d => {
      const u = d.data();
      if (!excluded.includes(u.uid)) suggestions.push(u);
    });
    res.json(suggestions.slice(0, 10));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/register — create profile after Firebase signup
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { name, handle } = req.body;
    if (!name || !handle) return res.status(400).json({ error: 'Name and handle required' });
    const existing = await db.collection('users').doc(req.uid).get();
    if (existing.exists) return res.json(existing.data());
    const userData = {
      uid: req.uid, name: name.trim(), handle: handle.trim().toLowerCase(),
      bio: '', avatar: '', following: [], followers: [],
      verified: false, pinnedPostId: null,
      createdAt: FieldValue.serverTimestamp()
    };
    await db.collection('users').doc(req.uid).set(userData);
    res.status(201).json(userData);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/:uid/mute — toggle mute
router.post('/:uid/mute', requireAuth, async (req, res) => {
  try {
    const myRef = db.collection('users').doc(req.uid);
    const muted = req.user.muted || [];
    const isMuted = muted.includes(req.params.uid);
    await myRef.update({
      muted: isMuted ? FieldValue.arrayRemove(req.params.uid) : FieldValue.arrayUnion(req.params.uid)
    });
    res.json({ muted: !isMuted });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/:uid/block — toggle block (also force-unfollows both ways)
router.post('/:uid/block', requireAuth, async (req, res) => {
  try {
    const myRef = db.collection('users').doc(req.uid);
    const theirRef = db.collection('users').doc(req.params.uid);
    const blocked = req.user.blocked || [];
    const isBlocked = blocked.includes(req.params.uid);
    if (isBlocked) {
      await myRef.update({ blocked: FieldValue.arrayRemove(req.params.uid) });
    } else {
      await myRef.update({
        blocked: FieldValue.arrayUnion(req.params.uid),
        following: FieldValue.arrayRemove(req.params.uid),
        followers: FieldValue.arrayRemove(req.params.uid)
      });
      await theirRef.update({
        following: FieldValue.arrayRemove(req.uid),
        followers: FieldValue.arrayRemove(req.uid)
      });
    }
    res.json({ blocked: !isBlocked });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LISTS ──────────────────────────────────────────────────────
// POST /api/users/me/lists — create a list
router.post('/me/lists', requireAuth, async (req, res) => {
  try {
    const { name, memberUids } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'List name required' });
    const ref = await db.collection('lists').add({
      ownerUid: req.uid, name: name.trim().slice(0, 50),
      members: Array.isArray(memberUids) ? memberUids.slice(0, 200) : [],
      createdAt: FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: ref.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/me/lists
router.get('/me/lists', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('lists').where('ownerUid', '==', req.uid).get();
    const lists = [];
    snap.forEach(d => lists.push({ id: d.id, ...d.data() }));
    res.json(lists);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/register — create profile after Firebase signup
// Uses verifyToken (not requireAuth) since no Firestore profile exists yet
// at this point — that's exactly what this route creates.
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { addUid, removeUid } = req.body;
    const ref = db.collection('lists').doc(req.params.listId);
    const doc = await ref.get();
    if (!doc.exists || doc.data().ownerUid !== req.uid) return res.status(403).json({ error: 'Not your list' });
    if (addUid) await ref.update({ members: FieldValue.arrayUnion(addUid) });
    if (removeUid) await ref.update({ members: FieldValue.arrayRemove(removeUid) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
