const { auth, db } = require('../services/firebase');

// Verify Firebase JWT and attach user to request
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    const token = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;

    // Attach user profile from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    req.user = userDoc.data();
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - attaches user if token present, continues anyway
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split('Bearer ')[1];
      const decoded = await auth.verifyIdToken(token);
      req.uid = decoded.uid;
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists) req.user = userDoc.data();
    }
  } catch (_) {}
  next();
}

// Verifies the JWT only — does NOT require a Firestore profile to already
// exist. Use this for routes that run before a profile is created, like
// /register. (requireAuth above 404s if no profile exists yet, which was
// blocking new users from ever completing signup.)
async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    const token = header.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, optionalAuth, verifyToken };
