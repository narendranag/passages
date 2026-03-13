# Passages — Stage 2 Implementation Plan

## Core Concept Change

Passages becomes a **public-first** platform. When someone saves a passage, it appears on the public front page by default — an [aldaily.com](https://aldaily.com)-style feed of the best things people are reading. Users can toggle individual saves to private, or flip a setting to make all their saves private by default.

This is a meaningful design choice: it turns Passages from a personal tool into a communal reading surface.

---

## What Gets Built

### 1. Authentication (JWT + Email/Password)

**Backend:**
- `POST /api/auth/register` — Create account (email, password, name)
- `POST /api/auth/login` — Returns JWT access token + refresh token
- `POST /api/auth/refresh` — Rotate refresh token
- Auth middleware on all `/api/passages` routes (except public feed)
- Password hashing with `bcrypt`
- Dependencies: `python-jose[cryptography]`, `passlib[bcrypt]`

**Frontend:**
- Login / Register pages (simple forms, no OAuth yet — keep it lean)
- Auth token stored in `localStorage`, attached to API calls
- Redirect to login when 401

**Extension:**
- Login flow in popup (email/password → store token in `chrome.storage.local`)
- Token attached to all API requests
- Logged-out state shows "Sign in to save passages"

### 2. Database: SQLite → PostgreSQL

- Swap `DATABASE_URL` to a PostgreSQL connection string
- Add `alembic` for schema migrations (so we never hand-edit production tables again)
- Initial migration: generate from current SQLModel definitions
- No code changes needed in models — SQLModel/SQLAlchemy handles the dialect switch

### 3. User Settings Model

Add to `User`:
```python
default_private: bool = False   # When True, all new saves are private
```

New endpoints:
- `GET /api/me` — Return current user profile + settings
- `PUT /api/me` — Update profile / settings (including `default_private`)

### 4. Public-by-Default Passages

**Model change:**
- `Passage.is_public` default flips from `False` → `True`
- On save: if user has `default_private=True`, override to `is_public=False`
- User can always override per-passage via a toggle

**New endpoint — Public Feed:**
- `GET /api/feed` — Paginated feed of all public passages, newest first
  - No auth required
  - Query params: `?limit=`, `?offset=`, `?tag=`, `?search=`
  - Returns passage + author attribution (user's display name)
  - Does NOT return private passages, ever

**Existing endpoint changes:**
- `GET /api/passages` — Still returns only the authenticated user's passages (public + private)
- `POST /api/passages` — Accepts `is_public` field; defaults based on user setting
- Extension and popup get a "Save privately" toggle

### 5. Public Front Page (aldaily.com Style)

**New route:** `/` (root) shows the public feed — no login required.

**Design:**
- Clean, editorial layout. Dense but readable.
- Each entry shows: passage text (truncated to ~300 chars), source title + author, who saved it, tags, timestamp
- Click to expand full passage + note
- Tag filtering in sidebar or top bar
- No infinite scroll — paginated pages (25 per page), like aldaily

**Authenticated dashboard** moves to `/my/passages` — your personal library with private + public passages, notes, edit/delete controls.

### 6. Extension Changes

- Add login UI to popup
- Add "Save privately" checkbox (default unchecked, or checked if user's `default_private` is true)
- Content script's "Save to Passages" button gets a small lock icon toggle for private saves
- All API calls include `Authorization: Bearer <token>` header

### 7. User Profiles (Light Touch)

- `GET /api/users/{user_id}/passages` — Public passages by a specific user
- `/u/{name}` route on frontend — shows a user's public passages
- Minimal: name + their public passages. No bio, no avatar (yet).

---

## Deployment Recommendation

### Backend: **Fly.io**

| Why | Detail |
|-----|--------|
| Simple Docker deploys | `fly deploy` from a Dockerfile |
| Built-in PostgreSQL | `fly postgres create` gives you a managed DB |
| Global edge | Runs close to users without config |
| Generous free tier | 3 shared VMs, 1GB Postgres free |
| Easy scaling | Scale from 1 → N machines with one command |

Alternatives considered:
- **Railway** — Slightly easier UI, but less control and higher cost at scale
- **Render** — Good but cold starts on free tier are brutal (30s+)
- **VPS (Hetzner/DigitalOcean)** — Cheapest long-term, but more ops burden

### Frontend: **Fly.io** (same platform)

Serve the Vite build from the same FastAPI process using `StaticFiles`, or as a separate Fly app. Single-origin keeps things simple (no CORS headaches).

**Recommended approach:** Serve frontend static files from FastAPI. One deploy, one domain, one SSL cert.

```python
# main.py addition
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
```

### Domain

Buy a clean domain. Something like `passages.io`, `passages.ink`, or `readpassages.com`. Point DNS to Fly.io.

### Extension

Host on Chrome Web Store once auth is solid. During development, continue side-loading.

---

## File Changes Summary

### New Files
```
backend/app/routers/auth.py          # Register, login, refresh
backend/app/routers/feed.py          # Public feed endpoint
backend/app/routers/users.py         # User profile + settings
backend/app/auth.py                  # JWT utils, password hashing, dependencies
backend/alembic/                     # Migration framework
backend/alembic.ini
backend/Dockerfile
fly.toml
frontend/src/pages/Home.jsx          # Public feed (landing page)
frontend/src/pages/Login.jsx         # Auth pages
frontend/src/pages/Register.jsx
frontend/src/pages/Dashboard.jsx     # Personal library (moved from App.jsx)
frontend/src/pages/UserProfile.jsx   # /u/{name} public profile
frontend/src/context/AuthContext.jsx  # Auth state management
frontend/src/components/FeedCard.jsx  # Public feed passage card
frontend/src/components/PrivacyToggle.jsx
```

### Modified Files
```
backend/app/models.py                # User.default_private, Passage.is_public default flip
backend/app/main.py                  # Auth middleware, static files mount, new routers
backend/app/routers/passages.py      # Auth-scoped queries, is_public handling
backend/app/database.py              # PostgreSQL connection
backend/requirements.txt             # New deps (jose, passlib, alembic, psycopg2)
extension/background.js              # Auth headers
extension/popup.js                   # Login flow, privacy toggle
extension/popup.html                 # Login UI, privacy checkbox
extension/content.js                 # Privacy toggle on save button
frontend/src/App.jsx                 # Router setup, auth wrapper
frontend/src/api.js                  # Auth headers, new endpoints
frontend/package.json                # react-router-dom
```

---

## Build Order

1. **Auth system** — Backend JWT + login/register endpoints + middleware
2. **Database migration** — Alembic setup, User.default_private, Passage.is_public default flip
3. **Public feed endpoint** — `GET /api/feed` with pagination
4. **User settings endpoint** — `GET/PUT /api/me`
5. **Frontend auth** — Login/register pages, auth context, protected routes
6. **Public front page** — aldaily-style feed at `/`
7. **Dashboard** — Move personal library to `/my/passages`
8. **Extension auth** — Login in popup, auth headers, privacy toggle
9. **Privacy toggle** — In extension + dashboard save flows
10. **Dockerize + deploy to Fly.io**
11. **User profiles** — `/u/{name}` pages

---

## What We're NOT Building Yet

- OAuth / social login (Stage 3 — adds complexity without value at this scale)
- Email verification (Stage 3 — just let people sign up and use it)
- Rate limiting (Stage 3 — add when there's traffic to limit)
- AI summaries / auto-tagging (Stage 3 — SaaS feature)
- Collections / folders (Stage 3)
- Import/export (Stage 3)
