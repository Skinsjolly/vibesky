const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

// Helper: deterministic conversation ID for two users
function convoId(a, b) { return [a, b].sort().join('_'); }

// GET /api/messages/conversations — list all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('conversations')
      .where('participants', 'array-contains', req.uid)
      .orderBy('lastMessageAt', 'desc')
      .limit(50).get();
    const convos = [];
    for (const d of snap.docs) {
      const c = d.data();
      const otherUid = c.participants.find(p => p !== req.uid);
      const otherDoc = await db.collection('users').doc(otherUid).get();
      convos.push({
        id: d.id,
        otherUser: otherDoc.exists ? { uid: otherUid, name: otherDoc.data().name, handle: otherDoc.data().handle, avatar: otherDoc.data().avatar } : null,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt?.toDate?.(),
        unreadCount: c.unread?.[req.uid] || 0
      });
    }
    res.json(convos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/messages/:otherUid — get message thread with a user
router.get('/:otherUid', requireAuth, async (req, res) => {
  try {
    const id = convoId(req.uid, req.params.otherUid);
    const snap = await db.collection('conversations').doc(id)
      .collection('messages').orderBy('createdAt', 'asc').limit(100).get();
    const messages = [];
    snap.forEach(d => messages.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));

    // Mark as read
    await db.collection('conversations').doc(id).set(
      { unread: { [req.uid]: 0 } }, { merge: true }
    );

    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/messages/:otherUid — send a message
router.post('/:otherUid', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });
    const otherUid = req.params.otherUid;
    const id = convoId(req.uid, otherUid);
    const me = req.user;

    const convoRef = db.collection('conversations').doc(id);
    const convoDoc = await convoRef.get();

    const message = {
      senderUid: req.uid, senderName: me.name,
      text: text.trim().slice(0, 1000),
      createdAt: FieldValue.serverTimestamp()
    };
    await convoRef.collection('messages').add(message);

    const otherUnread = convoDoc.exists ? (convoDoc.data().unread?.[otherUid] || 0) : 0;

    await convoRef.set({
      participants: [req.uid, otherUid],
      lastMessage: text.trim().slice(0, 100),
      lastMessageAt: FieldValue.serverTimestamp(),
      unread: { [otherUid]: otherUnread + 1, [req.uid]: 0 }
    }, { merge: true });

    res.status(201).json(message);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
