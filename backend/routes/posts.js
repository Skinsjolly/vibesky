const express = require('express');
const router = express.Router();
const { db, FieldValue, Timestamp } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

// Helper: build post object with viewer context
function serializePost(doc, viewerUid) {
  const d = doc.data ? doc.data() : doc;
  const id = doc.id || d.id;
  return {
    id,
    ...d,
    liked:    (d.likes    || []).includes(viewerUid),
    reposted: (d.reposts  || []).includes(viewerUid),
    likeCount:    (d.likes    || []).length,
    repostCount:  (d.reposts  || []).length,
    commentCount: d.commentCount || 0,
    createdAt: d.createdAt?.toDate?.() || d.createdAt,
    scheduledAt: d.scheduledAt?.toDate?.() || d.scheduledAt,
  };
}

// POST /api/posts — create post or thread
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      text, imageUrl, imageUrls, type = 'post',
      quotedPostId, pollOptions, pollDurationHours,
      threadPosts, scheduledAt, linkPreview
    } = req.body;
    const me = req.user;

    // Scheduled post
    const schedDate = scheduledAt ? new Date(scheduledAt) : null;

    // Thread: array of { text, imageUrl }
    if (type === 'thread' && Array.isArray(threadPosts) && threadPosts.length > 0) {
      const batch = db.batch();
      let prevId = null;
      const ids = [];
      for (const tp of threadPosts.slice(0, 25)) {
        const ref = db.collection('posts').doc();
        const data = {
          uid: req.uid, authorName: me.name, authorHandle: me.handle,
          authorAvatar: me.avatar || '', text: (tp.text || '').slice(0, 300),
          imageUrl: tp.imageUrl || '', type: 'thread',
          threadParentId: prevId, likes: [], reposts: [], commentCount: 0,
          verified: me.verified || false,
          createdAt: FieldValue.serverTimestamp()
        };
        batch.set(ref, data);
        ids.push(ref.id);
        prevId = ref.id;
      }
      await batch.commit();
      return res.status(201).json({ threadIds: ids });
    }

    // Poll
    let pollData = null;
    if (type === 'poll' && Array.isArray(pollOptions) && pollOptions.length >= 2) {
      const duration = Math.min(Math.max(pollDurationHours || 24, 1), 168);
      const endsAt = new Date(Date.now() + duration * 3600 * 1000);
      pollData = {
        options: pollOptions.slice(0, 4).map(o => ({ text: o, votes: [] })),
        endsAt: Timestamp.fromDate(endsAt),
        totalVotes: 0
      };
    }

    const postData = {
      uid: req.uid, authorName: me.name, authorHandle: me.handle,
      authorAvatar: me.avatar || '', verified: me.verified || false,
      text: (text || '').slice(0, 300),
      imageUrl: imageUrl || '',
      imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 4) : [],
      type,
      quotedPostId: quotedPostId || null,
      poll: pollData,
      linkPreview: linkPreview || null,
      likes: [], reposts: [], commentCount: 0,
      views: 0, pinned: false,
      status: schedDate ? 'scheduled' : 'published',
      scheduledAt: schedDate ? Timestamp.fromDate(schedDate) : null,
      createdAt: FieldValue.serverTimestamp()
    };

    // Fetch quoted post data inline
    if (quotedPostId) {
      const qDoc = await db.collection('posts').doc(quotedPostId).get();
      if (qDoc.exists) {
        const q = qDoc.data();
        postData.quotedPost = {
          id: quotedPostId,
          authorName: q.authorName, authorHandle: q.authorHandle,
          authorAvatar: q.authorAvatar || '',
          text: (q.text || '').slice(0, 200)
        };
      }
    }

    const ref = await db.collection('posts').add(postData);

    // Hashtag indexing
    const hashtags = (text || '').match(/#[\w]+/g) || [];
    for (const tag of hashtags) {
      const t = tag.toLowerCase();
      const tagRef = db.collection('hashtags').doc(t.slice(1));
      await tagRef.set({ tag: t, count: FieldValue.increment(1), lastUsed: FieldValue.serverTimestamp() }, { merge: true });
    }

    // Increment author post count
    await db.collection('users').doc(req.uid).update({ postCount: FieldValue.increment(1) }).catch(() => {});

    res.status(201).json({ id: ref.id, ...postData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/posts/:id — single post with quoted post + comments preview
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('posts').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });

    // Increment view count
    await doc.ref.update({ views: FieldValue.increment(1) }).catch(() => {});

    const post = serializePost(doc, req.uid);

    // Fetch quoted post if needed
    if (post.quotedPostId && !post.quotedPost) {
      const qDoc = await db.collection('posts').doc(post.quotedPostId).get();
      if (qDoc.exists) post.quotedPost = serializePost(qDoc, req.uid);
    }

    // Fetch top-level comments
    const commentsSnap = await db.collection('posts').doc(req.params.id)
      .collection('comments').orderBy('createdAt','asc').limit(50).get();
    const comments = [];
    commentsSnap.forEach(d => comments.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));
    post.comments = comments;

    res.json(post);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('posts').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    if (doc.data().uid !== req.uid) return res.status(403).json({ error: 'Not your post' });
    await doc.ref.delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/posts/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const ref = db.collection('posts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    const liked = (doc.data().likes || []).includes(req.uid);
    if (liked) {
      await ref.update({ likes: FieldValue.arrayRemove(req.uid) });
    } else {
      await ref.update({ likes: FieldValue.arrayUnion(req.uid) });
      if (doc.data().uid !== req.uid) {
        const me = req.user;
        await db.collection('notifications').add({
          targetUid: doc.data().uid, type: 'like',
          actorUid: req.uid, actorName: me.name, actorAvatar: me.avatar || '',
          postId: req.params.id, postText: (doc.data().text || '').slice(0, 80),
          text: `<strong>${me.name}</strong> liked your post`,
          read: false, createdAt: FieldValue.serverTimestamp()
        });
      }
    }
    const updated = await ref.get();
    res.json({ liked: !liked, likeCount: (updated.data().likes || []).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/posts/:id/repost
router.post('/:id/repost', requireAuth, async (req, res) => {
  try {
    const ref = db.collection('posts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    const reposted = (doc.data().reposts || []).includes(req.uid);
    if (reposted) {
      await ref.update({ reposts: FieldValue.arrayRemove(req.uid) });
    } else {
      await ref.update({ reposts: FieldValue.arrayUnion(req.uid) });
      if (doc.data().uid !== req.uid) {
        const me = req.user;
        await db.collection('notifications').add({
          targetUid: doc.data().uid, type: 'repost',
          actorUid: req.uid, actorName: me.name, actorAvatar: me.avatar || '',
          postId: req.params.id,
          text: `<strong>${me.name}</strong> reposted your post`,
          read: false, createdAt: FieldValue.serverTimestamp()
        });
      }
    }
    const updated = await ref.get();
    res.json({ reposted: !reposted, repostCount: (updated.data().reposts || []).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });
    const postRef = db.collection('posts').doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) return res.status(404).json({ error: 'Post not found' });
    const me = req.user;
    const comment = {
      uid: req.uid, authorName: me.name, authorHandle: me.handle,
      authorAvatar: me.avatar || '', verified: me.verified || false,
      text: text.trim().slice(0, 300),
      likes: [], createdAt: FieldValue.serverTimestamp()
    };
    const ref = await postRef.collection('comments').add(comment);
    await postRef.update({ commentCount: FieldValue.increment(1) });
    if (postDoc.data().uid !== req.uid) {
      await db.collection('notifications').add({
        targetUid: postDoc.data().uid, type: 'comment',
        actorUid: req.uid, actorName: me.name, actorAvatar: me.avatar || '',
        postId: req.params.id,
        text: `<strong>${me.name}</strong> replied to your post`,
        read: false, createdAt: FieldValue.serverTimestamp()
      });
    }
    res.status(201).json({ id: ref.id, ...comment });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('posts').doc(req.params.id)
      .collection('comments').orderBy('createdAt','asc').limit(100).get();
    const comments = [];
    snap.forEach(d => comments.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));
    res.json(comments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/posts/:id/poll/vote
router.post('/:id/poll/vote', requireAuth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const ref = db.collection('posts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    const poll = doc.data().poll;
    if (!poll) return res.status(400).json({ error: 'No poll on this post' });
    if (new Date() > poll.endsAt.toDate()) return res.status(400).json({ error: 'Poll has ended' });
    const options = poll.options;
    if (optionIndex < 0 || optionIndex >= options.length) return res.status(400).json({ error: 'Invalid option' });
    // Remove from all options first, add to chosen
    const updates = {};
    options.forEach((_, i) => {
      updates[`poll.options.${i}.votes`] = i === optionIndex
        ? FieldValue.arrayUnion(req.uid)
        : FieldValue.arrayRemove(req.uid);
    });
    await ref.update(updates);
    const updated = await ref.get();
    res.json({ poll: updated.data().poll });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/posts/:id/analytics (own posts only)
router.get('/:id/analytics', requireAuth, async (req, res) => {
  try {
    const doc = await db.collection('posts').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    if (doc.data().uid !== req.uid) return res.status(403).json({ error: 'Not your post' });
    const d = doc.data();
    res.json({
      views:      d.views || 0,
      likes:      (d.likes || []).length,
      reposts:    (d.reposts || []).length,
      comments:   d.commentCount || 0,
      engagementRate: d.views ? (((d.likes||[]).length + (d.reposts||[]).length + (d.commentCount||0)) / d.views * 100).toFixed(2) : '0.00'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/posts/user/:uid — posts by a user
router.get('/user/:uid', requireAuth, async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    let q = db.collection('posts')
      .where('uid', '==', req.params.uid)
      .where('status', '!=', 'scheduled')
      .orderBy('status')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));
    if (cursor) {
      const cursorDoc = await db.collection('posts').doc(cursor).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }
    const snap = await q.get();
    const posts = [];
    snap.forEach(d => posts.push(serializePost(d, req.uid)));
    res.json({ posts, nextCursor: posts.length === parseInt(limit) ? posts[posts.length - 1].id : null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/posts/hashtag/:tag
router.get('/hashtag/:tag', requireAuth, async (req, res) => {
  try {
    const tag = '#' + req.params.tag.toLowerCase();
    const snap = await db.collection('posts')
      .where('status', '!=', 'scheduled')
      .orderBy('status')
      .orderBy('createdAt', 'desc')
      .limit(30).get();
    const posts = [];
    snap.forEach(d => {
      const p = d.data();
      if ((p.text || '').toLowerCase().includes(tag)) posts.push(serializePost(d, req.uid));
    });
    res.json(posts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
