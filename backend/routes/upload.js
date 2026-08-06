const express = require('express');
const router = express.Router();
const multer = require('multer');
const { bucket } = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
  }
});

// POST /api/upload/image — proper Firebase Storage upload (replaces base64-in-Firestore)
router.post('/image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const filename = `posts/${req.uid}/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true
    });

    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/upload/avatar
router.post('/avatar', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const filename = `avatars/${req.uid}/${Date.now()}_avatar`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true
    });

    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
