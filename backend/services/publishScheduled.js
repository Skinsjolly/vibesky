// Run this on a schedule (e.g. Render Cron Job, every 5 minutes) to publish
// posts whose scheduledAt time has passed.
//
// Render Cron Job command: node services/publishScheduled.js

const { db } = require('./firebase');

async function publishScheduledPosts() {
  const now = new Date();
  const snap = await db.collection('posts')
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', now)
    .limit(50)
    .get();

  if (snap.empty) {
    console.log('No scheduled posts to publish.');
    return;
  }

  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, { status: 'published' });
  });
  await batch.commit();
  console.log(`Published ${snap.size} scheduled post(s).`);
}

if (require.main === module) {
  publishScheduledPosts()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { publishScheduledPosts };
