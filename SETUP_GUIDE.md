# 📦 AUTO DJ – PRODUCTION SAFE MASTER SPEC (v4)

---

# 🎯 PROJECT PURPOSE

Build a Spotify playlist rotation web application with:

* OAuth login
* Playlist selection (Spotify + manual link)
* Automatic rotation
* Fallback playlist
* Background worker
* Supabase PostgreSQL
* React frontend
* FastAPI backend

---

# 🧱 ARCHITECTURE

```
React Frontend
        |
        v
FastAPI Backend
        |
        v
Supabase (PostgreSQL)
        |
        v
APScheduler Rotation Worker
```

Frontend never talks directly to Spotify.

---

# 📂 PROJECT STRUCTURE

Generate this exact structure:

```
autodj/
  frontend/
    src/
      pages/
        Login.jsx
        Dashboard.jsx
        Playlists.jsx
        Settings.jsx
        Rotation.jsx
      components/
        Navbar.jsx
        PlaylistCard.jsx
      routes/
        index.jsx
      services/
        api.js
      main.jsx
      App.jsx
    index.html
    package.json
    tailwind.config.js
    vite.config.js
    .env
  backend/
    app/
      __init__.py
      controllers/
        __init__.py
        auth_controller.py
        playlist_controller.py
        settings_controller.py
        rotation_controller.py
      routes/
        __init__.py
        auth_routes.py
        playlist_routes.py
        settings_routes.py
        rotation_routes.py
      services/
        __init__.py
        spotify_service.py
        supabase_service.py
      models/
        __init__.py
        playlist.py
        settings.py
      workers/
        __init__.py
        rotation_worker.py
      main.py
    requirements.txt
    .env
    .gitignore
```

---

# 🔒 AUTH STRATEGY

### Session Strategy

Use:

* JWT stored in HTTP-only cookie
* Backend validates JWT on each request

Do NOT:

* Store Spotify access_token in frontend
* Store refresh_token in frontend

### Spotify OAuth Scopes

Pass these scopes during `/auth/login` redirect:

```
user-read-playback-state
user-modify-playback-state
playlist-read-private
playlist-modify-private
playlist-modify-public
```

---

## Auth Flow

1. Frontend → `/auth/login`
2. Backend redirects to Spotify (with scopes above)
3. Spotify → `/auth/callback`
4. Backend exchanges code for:

   * access_token
   * refresh_token
5. Store refresh_token in DB
6. Generate JWT
7. Set HTTP-only cookie
8. Redirect to frontend dashboard (`http://localhost:5173/dashboard`)

---

# 🖥️ FRONTEND REQUIREMENTS

### Framework

* React (Vite)
* JavaScript (not TypeScript)

### Dependencies

* axios
* react-router-dom
* tailwindcss

### Frontend `package.json` (pinned)

Generate `frontend/package.json` with:

```json
"dependencies": {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-router-dom": "6.14.2",
  "axios": "1.6.0"
},
"devDependencies": {
  "tailwindcss": "3.3.3",
  "postcss": "8.4.27",
  "autoprefixer": "10.4.14"
}
```

No `^` prefixes. All versions pinned.

### Environment File

Create:

```
frontend/.env
```

Content:

```
VITE_BACKEND_URL=http://localhost:8001
```

Never include Spotify secrets in frontend.

---

### Pages & Frontend Routes

| Route | Component | Description |
|---|---|---|
| `/login` | Login.jsx | Spotify login redirect |
| `/dashboard` | Dashboard.jsx | Main user dashboard |
| `/playlists` | Playlists.jsx | Add/manage playlists |
| `/settings` | Settings.jsx | Rotation settings |
| `/rotation` | Rotation.jsx | Rotation status/control |

---

### Features

* Spotify login redirect
* Fetch user playlists (via backend)
* Add playlist manually via link
* Enable/Disable rotation
* Display active playlist
* Display next playlist

Frontend must ONLY communicate with backend.

Never call Spotify API directly from frontend.

### Auth Guard (Protected Routes)

All routes except `/login` require a valid JWT cookie.

On every protected page load:

1. Call `GET /auth/me`
2. If 401 → redirect to `/login`
3. If 200 → render page

Implement as a `ProtectedRoute` wrapper component in `routes/index.jsx`.

---

# 🐍 BACKEND REQUIREMENTS

### Framework

* FastAPI

### Environment File

Create:

```
backend/.env
```

Include:

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:8001/auth/callback
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
PORT=8001
FRONTEND_URL=http://localhost:5173
```

Do not hardcode credentials.

---

# 🗄️ DATABASE SCHEMA (FIXED)

All tables must include:

* Primary keys
* Foreign keys
* Default timestamps
* Indexes

---

## users

```sql
create table users (
    id uuid primary key default gen_random_uuid(),
    spotify_user_id text unique not null,
    refresh_token text not null,
    created_at timestamp default now()
);
```

---

## playlists

```sql
create table playlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    playlist_id text not null,
    name text,
    source text check (source in ('spotify','manual','fallback')),
    active boolean default true,
    created_at timestamp default now()
);
```

Index:

```sql
create index idx_playlists_user on playlists(user_id);
```

---

## settings

```sql
create table settings (
    user_id uuid primary key references users(id) on delete cascade,
    rotation_mode text check (rotation_mode in ('interval','playlist_end')) default 'playlist_end',
    interval_minutes integer default 30,
    fallback_playlist_id text,
    enabled boolean default false,
    current_playlist_index integer default 0,
    last_switch_at timestamp default now()
);
```

---

# 🌐 CORS CONFIGURATION (ADDED)

FastAPI must include:

```python
import os
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Without this, frontend will fail to make requests to the backend due to CORS policy.

---

# 📡 REQUIRED API ROUTES (COMPLETE)

| Route | Method | Description |
|---|---|---|
| `/auth/login` | GET | Redirect to Spotify login |
| `/auth/callback` | GET | Handle OAuth callback |
| `/auth/logout` | POST | Destroy JWT session |
| `/auth/me` | GET | Get current user info |
| `/playlists` | GET | Fetch user playlists |
| `/playlists` | POST | Add playlist manually |
| `/playlists/{id}` | DELETE | Remove playlist |
| `/settings` | GET | Get user settings |
| `/settings` | PUT | Update settings |
| `/rotation/start` | POST | Start rotation worker |
| `/rotation/stop` | POST | Stop rotation worker |
| `/rotation/status` | GET | Get current rotation state and active playlist |

---

# 🔗 MANUAL PLAYLIST LINK SUPPORT

Backend must:

1. Accept Spotify playlist URL
2. Extract playlist ID using regex
3. Validate using:

```
GET https://api.spotify.com/v1/playlists/{playlist_id}
```

4. Store valid playlist in database

---

# 🔁 ROTATION LOGIC (UNAMBIGUOUS)

Use `APScheduler` in `rotation_worker.py`.

Worker runs every 30 seconds.

If rotation_mode = "playlist_end":

* Detect track end
* Rotate playlist
* Update `settings.last_switch_at`

If rotation_mode = "interval":

* Read `settings.last_switch_at`
* Rotate when `interval_minutes` reached since `last_switch_at`
* Update `settings.last_switch_at`

Retry Spotify API if 401 or 429.
Log all failures.

---

# 🔑 TOKEN REFRESH STRATEGY

Before every Spotify API call:

1. Attempt call
2. If 401:

   * Refresh access token using refresh_token
   * Retry once
3. If still failing:

   * Disable rotation for user

---

# ⚠️ ERROR HANDLING REQUIREMENTS

Must handle:

* 401 (token expired)
* 429 (rate limit)
* Network timeout
* Playlist not found
* No active Spotify device

---

# 🚦 RATE LIMIT STRATEGY

1. Catch 429 errors from Spotify API
2. Parse `Retry-After` header
3. Sleep for that duration
4. Retry once
5. If still failing, disable rotation for that user

---

# 📦 DEPENDENCY POLICY (CONSISTENT)

Use pinned versions everywhere.

Generate `backend/requirements.txt` with:

```
fastapi==0.110.0
uvicorn==0.27.0
requests==2.31.0
python-dotenv==1.0.1
supabase==2.3.0
apscheduler==3.10.4
python-jose==3.3.0
```

No floating versions.

Frontend:

Generate `frontend/package.json` with pinned versions (see Frontend Requirements section).
Remove all `^` from package.json.

---

# 🔒 SECURITY RULES (EXPLICIT)

* `.env` must be in `.gitignore`
* Never expose Spotify client secret
* Never expose Supabase service key
* Use HTTPS in production
* Use secure cookies in production
* Validate playlist existence before playback

---

# 📁 .gitignore (REQUIRED)

```
venv/
node_modules/
.env
__pycache__/
dist/
```

---

# 🚀 DEPLOYMENT REQUIREMENTS

Backend:

```
gunicorn -k uvicorn.workers.UvicornWorker main:app
```

Frontend:

```
npm run build
```

Serve via Nginx.

Update:

* Spotify redirect URI to production URL
* CORS origin to production frontend URL

---

# 🧪 BUILD ORDER (STRICT)

1. Build frontend skeleton + routes
2. Create backend skeleton
3. Generate DB schema with PKs, FKs, defaults
4. Implement Spotify OAuth + JWT session
5. Implement playlist CRUD + manual link validation
6. Implement rotation worker + `last_switch_at` tracking
7. Connect frontend → backend endpoints
8. Add rate-limit handling
9. Test end-to-end rotation
10. Deploy VPS + Nginx + Gunicorn + frontend build

Do not skip steps.

---

# 🎯 COMPLETION DEFINITION

The project is complete only when:

* OAuth works
* JWT session persists
* Playlist can be added via link
* Rotation runs automatically
* Fallback works
* CORS passes
* No secrets in frontend
* No floating dependency versions