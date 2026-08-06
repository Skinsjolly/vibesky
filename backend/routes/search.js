const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

// GET /api/search?q=&type=all|users|posts|hashtags&date=&mediaOnly=true
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, type = 'all', date, mediaOnly } = req.query;
    if (!q?.trim()) return res.json({ users: [], posts: [], hashtags: [] });
    const ql = q.toLowerCase().trim();

    const result = { users: [], posts: [], hashtags: [] };

    if (type === 'all' || type === 'users') {
      const uSnap = await db.collection('users').limit(100).get();
      uSnap.forEach(d => {
        const u = d.data();
        if (u.name?.toLowerCase().includes(ql) || u.handle?.toLowerCase().includes(ql)) {
          const { email, ...safe } = u;
          result.users.push(safe);
        }
      });
      result.users = result.users.slice(0, 15);
    }

    if (type === 'all' || type === 'posts') {
      let pQuery = db.collection('posts').where('status', '==', 'published').orderBy('createdAt', 'desc').limit(150);
      const pSnap = await pQuery.get();
      pSnap.forEach(d => {
        const p = d.data();
        if (!(p.text || '').toLowerCase().includes(ql)) return;
        if (mediaOnly === 'true' && !p.imageUrl) return;
        if (date) {
          const postDate = p.createdAt?.toDate?.();
          if (!postDate || postDate.toISOString().slice(0,10) !== date) return;
        }
        result.posts.push({
          id: d.id, ...p,
          createdAt: p.createdAt?.toDate?.(),
          likeCount: (p.likes||[]).length,
          repostCount: (p.reposts||[]).length
        });
      });
      result.posts = result.posts.slice(0, 25);
    }

    if (type === 'all' || type === 'hashtags') {
      const hSnap = await db.collection('hashtags').limit(100).get();
      hSnap.forEach(d => {
        const h = d.data();
        if (h.tag?.toLowerCase().includes(ql)) result.hashtags.push(h);
      });
      result.hashtags.sort((a,b) => (b.count||0) - (a.count||0));
      result.hashtags = result.hashtags.slice(0, 10);
    }

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
