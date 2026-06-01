# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| Backend | Django REST Framework · Python 3.11 · SQLite |
| Auth | SimpleJWT — tokens stored in `localStorage` (`sl_access`, `sl_refresh`) |
| Icons | lucide-react |

## Dev Commands

### Frontend (`cd stagelink`)
```bash
npm install        # install dependencies
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

### Backend (`cd backend`)
```bash
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

python manage.py runserver     # http://localhost:8000
python manage.py migrate       # apply migrations
python manage.py createsuperuser
```

Both services must run simultaneously. The frontend hardcodes `http://localhost:8000/api` as the API base.

## Architecture

### Two-part project

```
UVAII Task/
├── stagelink/      ← Next.js frontend
│   ├── src/app/    ← App Router pages (route = folder)
│   ├── src/lib/    ← api.ts, auth.ts, artstage/ types+utils
│   └── src/components/
│       ├── layout/ ← Navbar, NavbarSpacer
│       ├── ui/     ← shadcn/ui base components
│       └── artstage/ ← domain components (profile, reels, posts)
└── backend/
    └── api/        ← models.py, views.py, serializers.py, urls.py
```

### API client (`stagelink/src/lib/api.ts`)

`apiClient` is a thin fetch wrapper. It:
- Attaches `Authorization: Bearer {sl_access}` automatically
- On 401: calls `/auth/token/refresh/`, retries once, then clears tokens and redirects to `/login`
- Methods: `get<T>`, `post<T>`, `patch<T>`, `put<T>`, `delete<T>`

### Auth (`stagelink/src/lib/auth.ts`)

`getUser()` base64-decodes the JWT payload from localStorage — **returns null server-side** (`typeof window === 'undefined'`). Auth checks belong in `"use client"` components. Cookie `sl_authed=1` is used only for server-side routing guards.

User shape decoded from token:
```typescript
{ user_id: number; role: 'ARTIST'|'HIRER'|'AGENCY'|'FAN'; email: string; exp: number }
```

### Design system

Pages that use ArtStage styling add a `.artstage` wrapper class. All design tokens live as CSS variables in `stagelink/src/app/globals.css`:

| Variable | Role |
|---|---|
| `--as-bg` | Page background (#FAF9F6 cream) |
| `--as-surface` | Card / panel background |
| `--as-border` | Borders |
| `--as-accent` | Brand colour (#a9000f red) |
| `--as-text` / `--as-text-muted` | Text hierarchy |
| `--as-font-display` | Newsreader serif (headings) |

Use CSS vars in Tailwind via arbitrary values: `bg-[var(--as-accent)]`, `border-[var(--as-border)]`.

### Backend URL structure

All routes are under `/api/`. Router-registered ViewSets:

| Prefix | ViewSet |
|---|---|
| `talents/` | TalentViewSet — `?search=`, `?discipline=`, `?location=`, `?verified=`, `?available=`, `?mine=true` |
| `opportunities/` | OpportunityViewSet — `?role_type=`, `?pay_range=`, `?union=`, `?deadline=`, `?location=`, `?owner=me` |
| `applications/` | ApplicationViewSet |
| `messages/` | MessageViewSet — `?with={user_id}` auto-marks thread read |
| `notifications/` | NotificationViewSet |
| `events/` | EventViewSet — `book/` / `unbook/` actions |
| `reels/` (non-router) | ReelView — `?search=`, `?type=`, `?mine=true`, `?talent={id}` |

Custom auth endpoints: `/auth/login/`, `/auth/register/`, `/auth/token/refresh/`, `/auth/me/`.

Artist profile namespace: `/artists/{username}/` + `/reels/`, `/posts/`, `/availability/`, `/livestream/`.

### Adding a new endpoint (typical pattern)

1. Add model to `backend/api/models.py` → run `python manage.py makemigrations && migrate`
2. Add serializer to `serializers.py`
3. Add ViewSet or APIView to `views.py`
4. Register in `urls.py` router or `urlpatterns`
5. Call from frontend via `apiClient` — no global state, just `useState` + `useEffect`

### Role-gated UI

```typescript
const isHirerOrAgency = user?.role === 'HIRER' || user?.role === 'AGENCY';
```

Nav links, action buttons, and whole sections conditionally render by role. Backend enforces the same rules via `request.user.role` checks and `PermissionDenied`.

### Key business rules

- **Visibility levels** on Reels/Posts: `public | platform_only | industry_only | scout_only | private`. Enforced server-side in `ArtistReelsView`.
- **Application stages**: New → Shortlisted → Callback → Approved → Hired / Rejected. Stage changes emit a `Notification`.
- **Reel duration limits** (enforced in `ReelView.post`): `reel` ≤ 90 s, most types ≤ 600 s, `voice_demo` ≤ 1800 s.
- **Counters** (`Talent.views`, `Opportunity.applicants`, `FeedItem.likes`) use Django `F()` expressions to avoid race conditions.

### Existing stagelink/CLAUDE.md

`stagelink/CLAUDE.md` re-exports `stagelink/AGENTS.md`, which instructs: **read `node_modules/next/dist/docs/` before writing Next.js code** — this version has breaking API changes from training data.
