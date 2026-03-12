# Passages — Staged Evolution Plan

## Vision
A modern bookmarks app that lets you save the best passages from articles, essays, and poems — with metadata, summaries, and a beautiful reading experience. Evolves from personal tool to multi-user SaaS with mobile apps.

---

## Stage 1: Personal Tool (MVP)
**Goal:** A working tool you can use daily to save and browse passages.

### Tech Choices (with future in mind)
| Layer | Choice | Why future-proof |
|-------|--------|-----------------|
| Backend | FastAPI + SQLAlchemy/SQLModel | SQLAlchemy works with SQLite now, PostgreSQL later — zero code changes |
| Database | SQLite (local) | Swap to PostgreSQL with a config change when ready |
| API Design | RESTful with user_id baked into models | Multi-user ready from day one at the data layer |
| Frontend | React + Vite + TailwindCSS | Component library reusable across web and mobile (React Native) |
| Extension | Chrome Manifest V3 | Standard, publishable to Chrome Web Store |

### Data Model
```
User (single user for now, but the table exists)
  - id, email, name, created_at

Passage
  - id, user_id (FK)
  - selected_text        # The highlighted passage
  - note                 # Personal annotation
  - source_url           # Link back to original
  - source_title         # Article/essay/poem title
  - author_name          # Who wrote it
  - published_date       # When it was originally published
  - summary              # Auto-generated or manual
  - saved_at             # When you bookmarked it
  - is_public            # For future sharing (default: false)

Tag
  - id, name

PassageTag (many-to-many)
  - passage_id, tag_id
```

### What Gets Built
1. **Backend API** — CRUD for passages, tags, basic search
2. **Chrome Extension** — Select text → click save → passage stored with URL, title, author auto-extracted
3. **Web UI** — Browse, search, and manage your saved passages
4. **Metadata extraction** — Auto-pull title, author, publish date from the source page
5. **Summary generation** — Optional integration with an LLM API for auto-summaries

### Deliverables
- `POST /passages` — Save a new passage
- `GET /passages` — List/search passages (with filtering by tag, author, date)
- `GET /passages/{id}` — View a single passage
- `PUT /passages/{id}` — Edit passage / add notes
- `DELETE /passages/{id}` — Remove a passage
- `GET/POST /tags` — Tag management
- Chrome extension that captures selection + page metadata
- Web dashboard to browse and manage passages

---

## Stage 2: Multi-User + Auth
**Goal:** Other people can sign up and use Passages.

### Changes
| What | How |
|------|-----|
| Auth | Add JWT-based auth (FastAPI + python-jose) or integrate Auth0/Clerk for managed auth |
| Database | Migrate SQLite → PostgreSQL (hosted: Supabase, Neon, or Railway) |
| API | Add auth middleware, all queries scoped to authenticated user |
| Deployment | Containerize with Docker, deploy to Railway/Fly.io/Render |
| Frontend | Add login/signup pages, auth token management |
| Extension | Add login flow in popup, store auth token |

### New Features
- User registration and login
- Public/private passages (share a passage with a public link)
- User profiles with public reading lists
- Import/export (JSON, CSV)

---

## Stage 3: SaaS + Payments
**Goal:** Monetize with a freemium model.

### Pricing Model (suggested)
| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 50 passages, basic features |
| Pro | $5/mo | Unlimited passages, AI summaries, collections, advanced search |
| Team | $12/mo per seat | Shared collections, team annotations, API access |

### Changes
| What | How |
|------|-----|
| Payments | Stripe integration (subscriptions + webhooks) |
| Limits | Middleware to enforce tier limits |
| Admin | Admin dashboard for user management, metrics |
| Infrastructure | Move to production-grade hosting, add monitoring (Sentry), analytics |
| Legal | Terms of service, privacy policy, GDPR compliance |

### New Features
- Collections / folders for organizing passages
- Full-text search (PostgreSQL full-text or Typesense/Meilisearch)
- AI-powered features: auto-tagging, related passages, smart summaries
- API access for Pro/Team users
- Browser extension published to Chrome Web Store + Firefox Add-ons

---

## Stage 4: Mobile App
**Goal:** Save and read passages on mobile.

### Approach Options
| Option | Pros | Cons |
|--------|------|------|
| **React Native** | Share component logic with web frontend, single codebase | Larger bundle, bridge overhead |
| **PWA** | Zero app store friction, works everywhere | Limited native APIs (share sheet) |
| **Expo (React Native)** | Fastest path to both iOS + Android, OTA updates | Still need app store review |

### Recommended: Start with PWA, then Expo
1. Make the web frontend a Progressive Web App (installable, offline-capable)
2. Build native apps with Expo when you need share sheet integration and push notifications

### Mobile-Specific Features
- Share sheet integration (share from any app → save passage)
- Push notifications (daily reading digest)
- Offline reading mode
- Reader-friendly typography

---

## Architecture Evolution

```
Stage 1 (Now)                    Stage 2-3                      Stage 4
─────────────                    ─────────                      ───────

┌──────────┐                  ┌──────────┐                  ┌──────────┐
│ Chrome   │                  │ Chrome   │                  │ Chrome   │
│ Extension│                  │ Extension│                  │ Extension│
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                             │                              │
     ▼                             ▼                              ▼
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│ FastAPI  │                  │ FastAPI  │                  │ FastAPI  │
│ (local)  │                  │ (cloud)  │                  │ (cloud)  │
└────┬─────┘                  ├──────────┤                  ├──────────┤
     │                        │ Auth     │                  │ Auth     │
     ▼                        │ Stripe   │                  │ Stripe   │
┌──────────┐                  └────┬─────┘                  │ Push     │
│ SQLite   │                       │                        └────┬─────┘
└──────────┘                       ▼                              │
                              ┌──────────┐                       ▼
┌──────────┐                  │PostgreSQL│                  ┌──────────┐
│ React    │                  └──────────┘                  │PostgreSQL│
│ Web UI   │                                                └──────────┘
└──────────┘                  ┌──────────┐
                              │ React    │                  ┌──────────┐
                              │ Web UI   │                  │ React    │
                              └──────────┘                  │ Web/PWA  │
                                                            ├──────────┤
                                                            │ Expo     │
                                                            │ Mobile   │
                                                            └──────────┘
```

---

## Key Architectural Decisions (Made Now, Pay Off Later)

1. **User model from day one** — Even in Stage 1, passages belong to a user. Makes multi-user a config change, not a rewrite.
2. **SQLAlchemy ORM** — Same models work with SQLite and PostgreSQL. Migration is a connection string change.
3. **API-first design** — Extension, web UI, and future mobile app all consume the same API.
4. **React component library** — Shared UI components between web and future React Native app.
5. **Environment-based config** — API keys, DB URLs, feature flags all via environment variables from the start.

---

## Stage 1 — Build Order

This is what we build now:

1. **Backend API** — FastAPI app with SQLite, passage CRUD, tag management
2. **Chrome Extension** — Content script for text selection, popup for saving
3. **Web Frontend** — React + Vite dashboard for browsing passages
4. **Wire it together** — Extension talks to API, frontend displays data
5. **Polish** — Metadata extraction, basic search, clean UI

Ready to build?
