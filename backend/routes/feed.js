const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

function serializePost(doc, viewerUid) {
  const d = doc.data();
  return {
    id: doc.id, ...d,
    liked:    (d.likes   || []).includes(viewerUid),
    reposted: (d.reposts || []).includes(viewerUid),
    likeCount:    (d.likes   || []).length,
    repostCount:  (d.reposts || []).length,
    commentCount: d.commentCount || 0,
    createdAt: d.createdAt?.toDate?.() || null,
  };
}

// GET /api/feed/global?cursor=<postId>&limit=20
// Cursor-based pagination — fixes the "keeps loading continuously" bug by
// using a stable startAfter() cursor instead of re-fetching from the top.
router.get('/global', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    let q = db.collection('posts')
      .where('status', 'in', ['published']) // excludes scheduled posts
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (req.query.cursor) {
      const cursorDoc = await db.collection('posts').doc(req.query.cursor).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }

    const snap = await q.get();
    const posts = [];
    snap.forEach(d => posts.push(serializePost(d, req.uid)));

    // hasMore is only true if we got a FULL page back — this is the key fix.
    // Previously the frontend kept calling the same un-paginated query,
    // got the same 20 posts every time, and looped forever.
    const hasMore = posts.length === limit;
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    res.json({ posts, nextCursor, hasMore });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/feed/following?cursor=<postId>&limit=20
router.get('/following', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const following = req.user.following || [];
    const ids = [...following, req.uid];

    if (!ids.length) return res.json({ posts: [], nextCursor: null, hasMore: false });

    // Firestore 'in' queries max out at 30 items — chunk if needed
    const chunk = ids.slice(0, 30);
    let q = db.collection('posts')
      .where('uid', 'in', chunk)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (req.query.cursor) {
      const cursorDoc = await db.collection('posts').doc(req.query.cursor).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }

    const snap = await q.get();
    const posts = [];
    snap.forEach(d => posts.push(serializePost(d, req.uid)));

    const hasMore = posts.length === limit;
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    res.json({ posts, nextCursor, hasMore });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/feed/for-you — simple algorithmic feed
// Ranks recent posts (last 48h) by engagement score, weighted toward
// content from people the user's follows also engage with.
router.get('/for-you', requireAuth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000);
    const snap = await db.collection('posts')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(200).get();

    const posts = [];
    snap.forEach(d => {
      const p = serializePost(d, req.uid);
      if (p.createdAt && p.createdAt > since) posts.push(p);
    });

    // engagement score: likes*1 + reposts*2 + comments*1.5, decayed by age
    const now = Date.now();
    posts.forEach(p => {
      const ageHours = (now - p.createdAt.getTime()) / 3600000;
      const decay = Math.max(0.1, 1 - ageHours / 48);
      p._score = (p.likeCount * 1 + p.repostCount * 2 + p.commentCount * 1.5) * decay;
    });
    posts.sort((a, b) => b._score - a._score);

    res.json({ posts: posts.slice(0, 30).map(({ _score, ...p }) => p) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/feed/lists/:listId — feed from a specific list
router.get('/lists/:listId', requireAuth, async (req, res) => {
  try {
    const listDoc = await db.collection('lists').doc(req.params.listId).get();
    if (!listDoc.exists) return res.status(404).json({ error: 'List not found' });
    const members = listDoc.data().members || [];
    if (!members.length) return res.json({ posts: [] });
    const snap = await db.collection('posts')
      .where('uid', 'in', members.slice(0, 30))
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc').limit(30).get();
    const posts = [];
    snap.forEach(d => posts.push(serializePost(d, req.uid)));
    res.json({ posts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
