const express = require('express');
const router = express.Router();
const ogs = require('open-graph-scraper');
const { requireAuth } = require('../middleware/auth');

// GET /api/link-preview?url=https://...
router.get('/', requireAuth, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    // Basic SSRF guard — block localhost / private IP ranges
    const parsed = new URL(url);
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (blocked.includes(parsed.hostname) || parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.')) {
      return res.status(400).json({ error: 'URL not allowed' });
    }

    const { result } = await ogs({ url, timeout: 5000 });
    res.json({
      title: result.ogTitle || result.twitterTitle || '',
      description: result.ogDescription || result.twitterDescription || '',
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
      siteName: result.ogSiteName || parsed.hostname,
      url
    });
  } catch (e) {
    res.json({ title: '', description: '', image: '', siteName: '', url: req.query.url, error: 'Could not fetch preview' });
  }
});

module.exports = router;
