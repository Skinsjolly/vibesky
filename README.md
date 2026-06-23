# VibeSky 🚀

A modern social media platform built with Next.js 15, PostgreSQL, and a distinctive deep-space UI design.

> **Stack:** Next.js 15 (App Router) · TypeScript · Prisma ORM · PostgreSQL · TailwindCSS · JWT Auth

---

## Project Structure

```
vibesky/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & register pages (no sidebar)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/             # Authenticated app (with sidebar layout)
│   │   │   ├── feed/          # Home feed (following + discover)
│   │   │   ├── search/        # Search users & posts
│   │   │   ├── notifications/ # Notification center
│   │   │   ├── post/[id]/     # Single post with comments
│   │   │   └── [username]/    # User profile page
│   │   ├── api/
│   │   │   ├── auth/          # login / logout / register / me
│   │   │   ├── feed/          # Paginated feed endpoint
│   │   │   ├── posts/         # Create posts, likes, reposts, comments
│   │   │   ├── users/         # User profiles, follow/unfollow
│   │   │   ├── notifications/ # Notification list + unread count
│   │   │   └── search/        # Search users and posts
│   │   ├── globals.css
│   │   ├── layout.tsx         # Root layout with fonts
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── feed/
│   │   │   ├── Feed.tsx           # Infinite scroll feed
│   │   │   ├── PostCard.tsx       # Post with like/repost/comment
│   │   │   ├── ComposePost.tsx    # Post composer
│   │   │   ├── CommentModal.tsx   # Comment drawer
│   │   │   └── PostSkeleton.tsx   # Loading skeleton
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Desktop sidebar nav
│   │   │   ├── MobileNav.tsx      # Mobile bottom nav
│   │   │   └── SuggestedUsers.tsx # Follow suggestions
│   │   ├── profile/
│   │   │   └── EditProfileModal.tsx
│   │   └── ui/
│   │       └── Avatar.tsx
│   ├── lib/
│   │   ├── auth.ts            # JWT session management
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # cn(), formatRelativeTime(), formatCount()
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Database Schema

Key models and relationships:

```
User ─── posts ──► Post ─── likes ──► Like
     ─── likes ──►      ─── reposts ► Repost
     ─── follows ─►     ─── comments► Comment
     ─── notifications  ─── replies ► Post (self-ref)

Follow: followerId → User, followingId → User
Notification: recipientId, actorId, type (LIKE|REPOST|FOLLOW|COMMENT|REPLY)
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or a free Neon/Supabase account)
- npm or pnpm

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/vibesky"
JWT_SECRET="your-secret-here"  # openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with demo users and posts
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo accounts** (password: `password123`):
- `aurora@vibesky.app` — Aurora Chen (verified)
- `nova@vibesky.app` — Nova Patel
- `cosmo@vibesky.app` — Cosmo Rivera (verified)

---

## Deployment: Cloudflare Pages + Neon PostgreSQL

### Step 1: Set up your database (Neon)

1. Go to [neon.tech](https://neon.tech) → Create account → New project
2. Name it `vibesky`
3. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/vibesky?sslmode=require`)

### Step 2: Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial VibeSky commit"
gh repo create vibesky --public --push
# or: git remote add origin https://github.com/YOU/vibesky.git && git push -u origin main
```

### Step 3: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Connect your GitHub account → Select your `vibesky` repo
3. Configure build settings:

| Setting | Value |
|---|---|
| Framework preset | **Next.js** |
| Build command | `npm run build` |
| Build output directory | `.next` |
| Node.js version | `18` |

4. Click **Save and Deploy** — first build will likely fail (missing env vars), that's okay.

### Step 4: Set environment variables in Cloudflare

Go to your Pages project → **Settings** → **Environment variables** → Add:

```
DATABASE_URL        = postgresql://user:pass@ep-xxx.neon.tech/vibesky?sslmode=require
JWT_SECRET          = (run: openssl rand -base64 32)
NEXT_PUBLIC_APP_URL = https://vibesky.pages.dev
NODE_ENV            = production
```

Set these for **both** Production and Preview environments.

### Step 5: Run database migrations on production

Option A — From your local machine with prod DATABASE_URL:
```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

Option B — Use Neon's SQL editor to run the migration SQL directly.

### Step 6: Redeploy

In Cloudflare Pages → **Deployments** → **Retry deployment** on the latest commit.

Your app will be live at `https://vibesky.pages.dev` (or your custom domain).

### Step 7: Custom domain (optional)

Pages → **Custom domains** → Add domain → Follow DNS instructions.

---

## Alternative Database Options

| Provider | Free Tier | Notes |
|---|---|---|
| **Neon** | 0.5 GB, 1 project | Best for serverless, branching |
| **Supabase** | 500 MB, 2 projects | Includes Auth, Storage |
| **PlanetScale** (MySQL) | Requires schema changes | No foreign keys by default |
| **Railway** | $5 credit/mo | Easiest setup |

---

## Production Checklist

### Security
- [ ] `JWT_SECRET` is a random 32+ byte string (not the default)
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require` on Neon)
- [ ] `NODE_ENV=production` is set
- [ ] Passwords hashed with bcrypt (cost factor 12) ✅ already done
- [ ] HTTP-only, Secure cookies ✅ already done
- [ ] SQL injection protected via Prisma ORM ✅ already done

### Performance
- [ ] Enable Cloudflare's **Speed** optimizations (minify CSS/JS/HTML)
- [ ] Turn on **Cache Rules** for static assets
- [ ] Consider Cloudflare **KV** for session caching at scale
- [ ] Add `ISR` (Incremental Static Regeneration) for profile pages
- [ ] Database connection pooling — use Neon's pooled connection string for serverless

### Scalability
- [ ] Add database indexes (already in schema: `@@index([authorId])`, `@@index([createdAt])`)
- [ ] Implement rate limiting (Cloudflare Rules → Rate Limiting)
- [ ] Consider Cloudflare R2 for image storage instead of external URLs
- [ ] Add pagination cursors (already implemented with cursor-based pagination ✅)

### Monitoring
- [ ] Cloudflare Analytics (built-in, no setup needed)
- [ ] Add Sentry for error tracking: `npm install @sentry/nextjs`
- [ ] Neon's built-in query analytics

---

## Common Deployment Pitfalls

**Build fails with Prisma error:**
```
Error: @prisma/client did not initialize yet
```
Fix: Make sure `prisma generate` runs before build. The `package.json` already has `"build": "prisma generate && next build"`.

**Database connection timeout:**
Neon serverless databases "sleep" after inactivity. Use Neon's pooled connection string and add `?connect_timeout=10` to the URL.

**Images not loading:**
Add any external image domains to `next.config.ts` under `images.remotePatterns`.

**Cookie not persisting in production:**
Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain and `secure: true` is set (it is, based on `NODE_ENV`).

**`[username]` route conflicts with other routes:**
The `(app)/[username]` catch-all comes after more specific routes (`feed`, `search`, `notifications`, `post`) so Next.js resolves them correctly by route specificity.

---

## Adding Features

**Image uploads (Cloudflare R2):**
```bash
npm install @aws-sdk/client-s3
```
Create `/api/upload` route using R2 credentials, return the public URL to store in `post.imageUrl`.

**Real-time notifications (Cloudflare Durable Objects):**
Replace polling with WebSocket connections via Cloudflare's Durable Objects.

**Full-text search:**
Upgrade from `ILIKE` to PostgreSQL `tsvector` full-text search, or add Algolia/Typesense.

---

## Scripts Reference

```bash
npm run dev          # Start dev server on :3000
npm run build        # Generate Prisma client + build Next.js
npm run start        # Run production build locally
npm run db:push      # Sync Prisma schema → database (dev/staging)
npm run db:seed      # Seed demo users and posts
npm run db:studio    # Open Prisma Studio (database GUI)
npm run lint         # Run ESLint
```
