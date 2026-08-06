const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications?cursor=<id>&limit=30
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    let q = db.collection('notifications')
      .where('targetUid', '==', req.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (req.query.cursor) {
      const cursorDoc = await db.collection('notifications').doc(req.query.cursor).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }

    const snap = await q.get();
    const notifs = [];
    snap.forEach(d => notifs.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));
    const hasMore = notifs.length === limit;
    res.json({ notifications: notifs, nextCursor: hasMore ? notifs[notifs.length - 1].id : null, hasMore });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('targetUid', '==', req.uid)
      .where('read', '==', false)
      .get();
    res.json({ count: snap.size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/notifications/mark-read — mark all as read
router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('targetUid', '==', req.uid)
      .where('read', '==', false)
      .limit(200).get();
    const batch = db.batch();
    snap.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ success: true, updated: snap.size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
