# VibeSky

A full-stack, Bluesky-inspired social platform. Split into a **React frontend** and a **Node/Express backend**, backed by **Firebase** (Auth, Firestore, Storage).

```
vibesky/
├── frontend/          React + Vite app (deploys to Cloudflare Pages)
├── backend/           Express API (deploys to Render)
└── firestore.rules    Firestore security rules
```

---

## Features

Auth · Feeds (Following / For You / Latest) · Post detail pages · Threads · Polls · Quote posts · Image uploads · Link previews · Scheduled posts · Likes/Reposts/Comments · Bookmarks · Lists · Hashtag pages · Trending (real, volume-based) · Follow/Unfollow · Mute/Block · Direct messages · Notifications · Post analytics · Pinned posts · Verified badges · Advanced search filters

---

## 1. Firebase Setup

You need one Firebase project providing **Auth**, **Firestore**, and **Storage**.

1. [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → enable **Email/Password**
2. **Firestore Database** → Create → Production mode
3. **Storage** → Get started → Production mode
4. Deploy the rules in `firestore.rules`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
5. Create the composite indexes below (or just run the app — Firestore errors include a direct "create index" link you can click)

### Composite Indexes Required

| Collection | Fields |
|---|---|
| `posts` | `status` ASC, `createdAt` DESC |
| `posts` | `uid` ASC, `status` ASC, `createdAt` DESC |
| `posts` | `status` ASC, `scheduledAt` ASC |
| `notifications` | `targetUid` ASC, `createdAt` DESC |
| `notifications` | `targetUid` ASC, `read` ASC |
| `conversations` | `participants` (array-contains), `lastMessageAt` DESC |

### Get your Service Account Key (backend needs this)
1. Firebase Console → ⚙️ **Project settings** → **Service accounts**
2. Click **Generate new private key** → downloads a JSON file
3. You'll paste this into Render's environment variables (see below) — never commit it to Git

---

## 2. Push to GitHub

```bash
cd vibesky
git init
git add .
git commit -m "Initial VibeSky commit"
gh repo create vibesky --private --source=. --push
# or manually: create a repo on github.com, then
# git remote add origin https://github.com/YOUR_USERNAME/vibesky.git
# git branch -M main
# git push -u origin main
```

> `.gitignore` already excludes `node_modules`, `.env` files, and `serviceAccountKey.json` — double check nothing sensitive gets committed.

---

## 3. Deploy the Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repo, select the `vibesky` repo
3. Configure:
   - **Name:** `vibesky-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or Starter for no cold-starts)
4. Add environment variables (Render Dashboard → your service → **Environment**):

   | Key | Value |
   |---|---|
   | `PORT` | `4000` |
   | `FRONTEND_URL` | `https://vibesky.pages.dev` (your future Cloudflare URL — update after step 4) |
   | `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire contents** of your service account JSON as one line |
   | `FIREBASE_STORAGE_BUCKET` | `vibesky-1bd36.firebasestorage.app` |

5. Click **Create Web Service** — Render will build and deploy. Note your backend URL, e.g. `https://vibesky-api.onrender.com`

### Optional: Scheduled Post Publisher (Cron Job)
Scheduled posts need something to flip them from `scheduled` → `published` once their time arrives.

1. Render Dashboard → **New** → **Cron Job**
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Command:** `node services/publishScheduled.js`
5. **Schedule:** `*/5 * * * *` (every 5 minutes)
6. Add the same `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_STORAGE_BUCKET` env vars

> Free Render web services spin down after inactivity and take ~30s to wake on the next request. Upgrade to a paid instance to avoid this in production.

---

## 4. Deploy the Frontend to Cloudflare Pages

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your `vibesky` repo
3. Configure build settings:
   - **Framework preset:** Vite
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variables (Cloudflare Pages → your project → **Settings** → **Environment variables**):

   | Key | Value |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyDBlMC8BmcZQGiS8lI0GKSXIqJTOpPWtuQ` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `vibesky-1bd36.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `vibesky-1bd36` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `vibesky-1bd36.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `259823049175` |
   | `VITE_FIREBASE_APP_ID` | `1:259823049175:web:ccd453d3d665813b185392` |
   | `VITE_FIREBASE_MEASUREMENT_ID` | `G-M9WFS1T50G` |
   | `VITE_API_URL` | `https://vibesky-api.onrender.com/api` (your Render URL from step 3, + `/api`) |

5. Click **Save and Deploy**
6. Your site goes live at `https://vibesky.pages.dev` (or your project name)

### Connect the two together
Go back to Render → your backend service → **Environment** → update `FRONTEND_URL` to your actual Cloudflare Pages URL, then **Manual Deploy** to restart with the new value (this makes CORS work correctly).

### Add your Pages domain to Firebase
Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add `vibesky.pages.dev` (and your custom domain if you set one up)

---

## 5. Run Locally

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — paste your service account JSON into FIREBASE_SERVICE_ACCOUNT,
# or place serviceAccountKey.json directly in backend/ (gitignored)
npm run dev   # nodemon, restarts on changes — http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # defaults already point to localhost:4000
npm run dev             # http://localhost:5173
```

---

## Production Checklist

**Security**
- [x] All Firestore access goes through the backend (Admin SDK) — Firestore rules deny direct client writes
- [x] JWT verification on every protected route (`requireAuth` middleware)
- [x] Rate limiting (200 req/15min general, 20 req/15min on auth-adjacent routes)
- [x] Helmet security headers, CORS locked to your frontend origin
- [x] SSRF guard on link-preview fetching (blocks localhost/private IPs)
- [ ] Add [Firebase App Check](https://firebase.google.com/docs/app-check) for extra bot protection
- [ ] Add CAPTCHA to signup if bot signups become an issue

**Performance**
- [x] Cursor-based pagination on feed/notifications (fixes infinite-load bugs)
- [x] Images served from Firebase Storage CDN, not embedded as base64
- [x] IntersectionObserver-based infinite scroll (no scroll-event thrashing)
- [ ] Consider Cloudflare Images or a dedicated image CDN for large-scale traffic
- [ ] Add Redis caching in front of trending/suggestions if traffic grows

**Common Pitfalls**
1. **CORS errors** — make sure `FRONTEND_URL` on Render exactly matches your Cloudflare Pages URL (no trailing slash)
2. **401 errors everywhere** — double-check `FIREBASE_SERVICE_ACCOUNT` is valid JSON on one line in Render's env vars
3. **Missing Firestore index errors** — click the link Firestore gives you in the error message; it auto-creates the exact index needed
4. **Render free tier cold starts** — first request after inactivity can take ~30s; upgrade to a paid instance for production
5. **Images not showing** — confirm your Storage bucket is set to public read for the `posts/` and `avatars/` paths, or that `makePublic()` succeeded

---

## API Reference (quick overview)

| Method | Path | Description |
|---|---|---|
| POST | `/api/users/register` | Create profile after Firebase signup |
| GET | `/api/users/by-handle/:handle` | Look up user by handle |
| PATCH | `/api/users/me` | Update own profile |
| POST | `/api/users/:uid/follow` | Follow/unfollow |
| GET | `/api/feed/following` | Following feed (paginated) |
| GET | `/api/feed/global` | Latest feed (paginated) |
| GET | `/api/feed/for-you` | Algorithmic feed |
| POST | `/api/posts` | Create post/thread/poll |
| GET | `/api/posts/:id` | Post detail + comments |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/repost` | Toggle repost |
| POST | `/api/posts/:id/comments` | Reply to post |
| GET | `/api/search?q=` | Search users/posts/hashtags |
| GET | `/api/trending` | Trending hashtags |
| GET/POST | `/api/messages/:otherUid` | DM thread |
| POST | `/api/upload/image` | Upload post image |

Full route definitions live in `backend/routes/`.
