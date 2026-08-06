const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

// GET /api/trending — real trending topics based on recent post volume
router.get('/', requireAuth, async (req, res) => {
  try {
    // Pull hashtags used recently, sorted by count
    const snap = await db.collection('hashtags')
      .orderBy('lastUsed', 'desc')
      .limit(50).get();

    const tags = [];
    snap.forEach(d => tags.push(d.data()));

    // Sort by count (volume) as the trending signal
    tags.sort((a, b) => (b.count || 0) - (a.count || 0));

    const trending = tags.slice(0, 10).map(t => ({
      tag: t.tag,
      count: t.count || 0,
      category: 'Trending'
    }));

    res.json(trending);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
