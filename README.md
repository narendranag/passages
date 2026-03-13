# Passages

Save and share the best passages from what you read. Highlight text from any article, essay, or poem and save it with a link back to the source, author details, and your personal notes. Public passages flow into a shared feed — an aldaily-style reading commons.

## Project Structure

```
passages/
├── backend/          # FastAPI REST API + SQLite
│   ├── app/
│   │   ├── main.py           # App entry point, static file serving
│   │   ├── models.py         # SQLModel schemas & DB models
│   │   ├── database.py       # DB engine & session
│   │   ├── auth.py           # JWT auth (HMAC-SHA256) + password hashing
│   │   ├── routers/
│   │   │   ├── auth.py       # Register, login, token refresh
│   │   │   ├── passages.py   # CRUD for passages (auth-scoped)
│   │   │   ├── feed.py       # Public feed (no auth required)
│   │   │   ├── users.py      # User profile & settings
│   │   │   └── tags.py       # Tag listing
│   │   └── services/
│   │       └── metadata.py   # Auto-extract title/author from URLs
│   └── requirements.txt
├── extension/        # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── content.js/css        # Text selection overlay on any page
│   ├── background.js         # Service worker — authenticated API calls
│   ├── popup.html/js         # Login + save UI with privacy toggle
│   └── icons/
├── frontend/         # React + Vite + Tailwind web UI
│   ├── src/
│   │   ├── App.jsx           # Router: public feed, auth, dashboard
│   │   ├── api.js            # API client with token refresh
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx      # Public feed (no login needed)
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx # Personal library at /my/passages
│   │   │   └── UserProfile.jsx
│   │   └── components/
│   │       ├── FeedCard.jsx
│   │       ├── PassageCard.jsx
│   │       └── SearchBar.jsx
│   └── package.json
├── Dockerfile        # Multi-stage build (Node + Python)
├── fly.toml          # Fly.io deployment config
└── PLAN.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:3000`. Proxies API requests to the backend.

### Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `extension/` directory
4. Sign in via the extension popup
5. Browse any page, select text, and click **Save to Passages**

## Deploy

```bash
fly launch            # First time: creates app + persistent volume
fly secrets set SECRET_KEY=$(openssl rand -hex 32)
fly deploy
```

The Dockerfile builds the frontend (Vite) and bundles it with the FastAPI backend. The backend serves the static frontend in production — no separate web server needed.

## API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feed` | Public passage feed (paginated, searchable) |
| `GET` | `/api/users/{id}/passages` | A user's public passages |
| `GET` | `/api/tags` | List all tags |
| `GET` | `/api/health` | Health check |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get access + refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh expired access token |

### Authenticated

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/me` | Current user profile & settings |
| `PUT` | `/api/me` | Update name, default_private |
| `POST` | `/api/passages` | Save a new passage |
| `GET` | `/api/passages` | List your passages (`?search=`, `?tag=`, `?visibility=`) |
| `GET` | `/api/passages/{id}` | Get one of your passages |
| `PUT` | `/api/passages/{id}` | Update a passage |
| `DELETE` | `/api/passages/{id}` | Delete a passage |

## Privacy Model

- Passages are **public by default** (visible in the feed)
- Each passage has an `is_public` toggle
- Users can set `default_private: true` in their settings to save privately by default
- Private passages are only visible to their owner
- The Chrome extension respects the user's default and offers a per-save toggle

## Data Model

Each passage stores:
- **selected_text** — the highlighted passage
- **source_url** — link back to the original article
- **source_title** — article title (auto-extracted if not provided)
- **author_name** — who wrote it (auto-extracted)
- **published_date** — when the original was published
- **note** — your personal annotation
- **tags** — categorization labels
- **is_public** — visible in public feed or private
- **saved_at** — when you saved it

## Tech Stack

- **Backend:** Python, FastAPI, SQLModel, SQLite
- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Extension:** Chrome Manifest V3, vanilla JS
- **Auth:** HMAC-SHA256 JWT, PBKDF2 password hashing (zero external crypto deps)
- **Deploy:** Docker, Fly.io

## License

MIT
