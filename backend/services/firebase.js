const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'vibesky-1bd36.firebasestorage.app'
  });
}

const db      = admin.firestore();
const auth    = admin.auth();
const storage = admin.storage();
const bucket  = storage.bucket();
const FieldValue = admin.firestore.FieldValue;
const Timestamp  = admin.firestore.Timestamp;

module.exports = { admin, db, auth, storage, bucket, FieldValue, Timestamp };
