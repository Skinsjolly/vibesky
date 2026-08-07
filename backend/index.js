require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Render (and most PaaS platforms) sit behind a reverse proxy, so trust
// the X-Forwarded-For header it sets. Without this, express-rate-limit
// throws a validation error on every request.
app.set('trust proxy', 1);

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' }
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── ROUTES ───────────────────────────────────────────────────────
app.use('/api/users',         require('./routes/users'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/feed',          require('./routes/feed'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search',        require('./routes/search'));
app.use('/api/trending',      require('./routes/trending'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/link-preview',  require('./routes/linkPreview'));

// ── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── ERROR HANDLER ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`VibeSky API running on port ${PORT}`));
