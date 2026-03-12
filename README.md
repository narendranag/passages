# Passages

Save the best passages from what you read. Highlight text from any article, essay, or poem and save it with a link back to the source, author details, and your personal notes.

## Project Structure

```
passages/
├── backend/          # FastAPI REST API + SQLite
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── models.py         # SQLModel schemas & DB models
│   │   ├── database.py       # DB engine & session
│   │   ├── routers/
│   │   │   ├── passages.py   # CRUD for passages
│   │   │   └── tags.py       # Tag listing
│   │   └── services/
│   │       └── metadata.py   # Auto-extract title/author from URLs
│   └── requirements.txt
├── extension/        # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── content.js/css        # Text selection overlay on any page
│   ├── background.js         # Service worker — API communication
│   ├── popup.html/js         # Extension popup UI
│   └── icons/
├── frontend/         # React + Vite + Tailwind web UI
│   ├── src/
│   │   ├── App.jsx           # Main app with search & filtering
│   │   ├── api.js            # API client
│   │   └── components/
│   │       ├── PassageCard.jsx
│   │       └── SearchBar.jsx
│   └── package.json
└── PLAN.md           # Staged evolution roadmap
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
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
4. Browse any page, select text, and click **Save to Passages**

> **Note:** The backend must be running for the extension to save passages.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/passages` | Save a new passage |
| `GET` | `/api/passages` | List passages (with `?search=`, `?tag=`, `?author=` filters) |
| `GET` | `/api/passages/{id}` | Get a single passage |
| `PUT` | `/api/passages/{id}` | Update a passage |
| `DELETE` | `/api/passages/{id}` | Delete a passage |
| `GET` | `/api/tags` | List all tags |
| `GET` | `/api/health` | Health check |

## Data Model

Each passage stores:
- **selected_text** — the highlighted passage
- **source_url** — link back to the original article
- **source_title** — article title (auto-extracted)
- **author_name** — who wrote it (auto-extracted)
- **published_date** — when the original was published
- **summary** — summary of the article
- **note** — your personal annotation
- **tags** — categorization labels
- **saved_at** — when you bookmarked it

## Roadmap

See [PLAN.md](PLAN.md) for the full staged evolution plan:

1. **Stage 1** (current) — Personal tool: local API + Chrome extension + web UI
2. **Stage 2** — Multi-user with auth, PostgreSQL, cloud deployment
3. **Stage 3** — SaaS with Stripe payments, AI features, advanced search
4. **Stage 4** — Mobile app (PWA → React Native/Expo)

## Tech Stack

- **Backend:** Python, FastAPI, SQLModel, SQLite
- **Frontend:** React, Vite, Tailwind CSS
- **Extension:** Chrome Manifest V3, vanilla JS

## License

MIT
