# BNI Cricket + CricPro — Integration Guide

## Project Overview

Two integrated websites sharing one backend and database:
1. **BNI Cricket Website** — Public tournament site with groups, matches, spinner reveal, news
2. **CricPro Scoring Website** — Ball-by-ball scoring engine with player performance dashboards

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + SQLAlchemy + Alembic |
| Database | PostgreSQL (schema: `bni`) |
| Auth | JWT (access + refresh tokens) |
| State | Redux Toolkit + TanStack React Query |
| Realtime | WebSocket (optional Redis pub/sub) |

---

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (running on localhost:5432)
- Database: `bni_cricket` (create if not exists)

---

## Setup Steps

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv bnivenv
bnivenv\Scripts\activate  # Windows
# source bnivenv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
alembic upgrade head

# Seed test data (teams, players, matches)
python seed_teams.py
python seed_players.py    # If exists — creates 20 player accounts
python seed_matches.py    # Creates 2 completed matches with full scoring data
python seed_live_match.py # Creates 1 LIVE match ready for scoring

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables (backend/.env)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgre123@localhost:5432/bni_cricket
SYNC_DATABASE_URL=postgresql://postgres:postgre123@localhost:5432/bni_cricket
POSTGRES_SCHEMA=bni
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
SECRET_KEY=change_this_to_a_very_long_random_secret_key_min_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@1234
ADMIN_EMAIL=admin@bnicricket.com
```

---

## URLs

### Frontend Pages

| URL | Description | Auth |
|-----|-------------|------|
| `/` | BNI Cricket Homepage | Public |
| `/group` | 5 Groups (A–E), 4 teams each | Public |
| `/group/:id` | Group matches | Public |
| `/matches` | Match list | Public |
| `/reveal-match` | Spinner reveal (6 matches/group) | Public |
| `/live-scores` | Live video/scores | Public |
| `/news` | News & blogs | Public |
| `/register` | Player registration form | Public |
| `/tournaments` | CricPro tournaments | Public |
| `/stats` | Batting/bowling leaderboards | Public |
| `/match/:id` | Match scorecard | Public |
| `/player/login` | Player login portal | Public |
| `/player/dashboard` | Personal performance stats | Player |
| `/admin/login` | Admin login | Public |
| `/admin/dashboard` | BNI Admin dashboard | Admin |
| `/admin/players` | Manage registered players | Admin |
| `/admin/news` | Manage news | Admin |
| `/admin/live-scores` | Manage live video | Admin |
| `/admin/spinner` | Spinner reveal admin | Admin |
| `/admin/reveal-match` | Match schedule admin | Admin |
| `/scoring-admin` | CricPro Scoring Admin | Admin |
| `/scoring-admin/dashboard` | Scoring overview | Admin |
| `/scoring-admin/matches` | Match management | Admin |
| `/scoring-admin/scores` | Score Editor (add/edit batting & bowling) | Admin |
| `/scoring-admin/players` | All player profiles | Admin |
| `/scoring-admin/tournaments` | Tournament management | Admin |
| `/scoring-admin/stats` | Statistics | Admin |
| `/scoring/matches/:id/live` | Ball-by-ball live scoring | Admin |
| `/scoring/matches/create` | Create new match | Admin |

### Backend API

| URL | Description |
|-----|-------------|
| `http://localhost:8000/health` | Health check |
| `http://localhost:8000/docs` | Swagger UI (interactive API docs) |
| `http://localhost:8000/redoc` | ReDoc (alternative docs) |

---

## Login Credentials

### Admin
- **Username:** `admin`
- **Password:** `Admin@1234`
- **Access:** Both BNI Admin + CricPro Scoring Admin

### Test Players (password: `Player@1234`)

| Username | Name | Team |
|----------|------|------|
| `raj_azpire` | Rajesh Kumar | BNI Azpire |
| `suresh_azpire` | Suresh Babu | BNI Azpire |
| `arjun_azpire` | Arjun Selvam | BNI Azpire |
| `karthik_azp` | Karthik Rajan | BNI Azpire |
| `vijay_bmk` | Vijay Anand | BNI Benchmark |
| `priya_bmk` | Priyanka Devi | BNI Benchmark |
| `muthu_bmk` | Muthukumar S | BNI Benchmark |
| `senthil_bmk` | Senthilkumar P | BNI Benchmark |
| `arun_chp` | Arun Prakash | BNI Champions |
| `deepak_chp` | Deepak Mohan | BNI Champions |
| `ganesh_chp` | Ganesh Raj | BNI Champions |
| `harish_chp` | Harish Venkat | BNI Champions |
| `kumar_dyn` | Kumar Sundaram | BNI Dynamic |
| `ravi_dyn` | Ravi Shankar | BNI Dynamic |
| `siva_dyn` | Sivakumar M | BNI Dynamic |
| `bala_dyn` | Balamurugan K | BNI Dynamic |
| `anbu_emp` | Anbuselvan R | BNI Emperor |
| `durai_emp` | Duraisamy P | BNI Emperor |
| `elan_emp` | Elangovam S | BNI Emperor |
| `felix_emp` | Felix Antony | BNI Emperor |

---

## Tournament Structure

| Config | Value |
|--------|-------|
| Groups | 5 (A, B, C, D, E) |
| Teams per group | 4 |
| Total teams | 20 |
| Matches per group | C(4,2) = 6 (zero duplicates) |
| Total matches | 30 |
| Spinner reveal | One spin = all 6 matches at once |

### Group Allocation

| Group | Teams |
|-------|-------|
| A | BNI Azpire, BNI Benchmark, BNI Champions, BNI Dynamic |
| B | BNI Emperor, BNI Fortune, BNI Gladiators, BNI Harmony |
| C | BNI Icons, BNI Jaaguar, BNI Kings, BNI Legends |
| D | BNI Millionaire, BNI Nest, BNI Oscar, BNI Prince |
| E | BNI Royals, BNI Spark, BNI Tycoon, BNI Warriors |

---

## Scoring Workflow

### Manual Score Entry (Score Editor)

1. Login as admin → Go to `/scoring-admin/scores`
2. Select a LIVE match from dropdown
3. Select innings
4. Click **"+ Add Batsman"** → pick player, enter runs/balls/4s/6s/dismissal
5. Click **"+ Add Bowler"** → pick player, enter overs/wickets/runs/economy
6. Click **🔄 Recalculate Totals** to update innings KPIs
7. Click **✅ Complete Innings** when done
8. Click **▶ Start 2nd Innings** → creates new innings with target

### Ball-by-Ball Live Scoring

1. From Score Editor, click **🏏 Ball-by-Ball Scoring**
2. Or navigate to `/scoring/matches/{match-id}/live`
3. Select **Striker** (batting team player)
4. Select **Non-Striker** (batting team player)
5. Select **Bowler** (bowling team player)
6. For each delivery:
   - Choose ball type (Normal/Wide/No Ball/Bye/Leg Bye)
   - Click runs off bat (0–6)
   - Check Wicket if dismissal → select type
   - Click **Record** to save the ball
7. Auto-tracks: overs, batsmen rotation, fall of wickets
8. **Undo Last Ball** available

### Player Dashboard

After scores are entered:
1. Player logs in at `/player/login`
2. Sees personal stats: total runs, average, strike rate, wickets, economy
3. Recent match-by-match batting & bowling records
4. All auto-calculated from match data

---

## Seed Scripts (backend/)

| Script | Purpose |
|--------|---------|
| `seed_teams.py` | Seeds 20 BNI teams into the database |
| `seed_players.py` | Creates 20 player accounts (4 per first 5 teams) |
| `seed_matches.py` | Creates 2 completed matches with full scoring data |
| `seed_live_match.py` | Creates 1 LIVE match (Emperor vs Fortune) ready for scoring |

Run order: `seed_teams.py` → `seed_players.py` → `seed_matches.py` → `seed_live_match.py`

Note: The backend startup also auto-seeds admin user and teams via `app/utils/seed.py`.

---

## API Endpoints (Key)

### Auth
- `POST /api/v1/auth/login` — Login (returns JWT)
- `GET /api/v1/auth/me` — Current user info
- `POST /api/v1/auth/refresh` — Refresh token

### CricPro Scoring
- `GET /api/v1/scoring/matches` — List all matches
- `POST /api/v1/scoring/matches` — Create match
- `GET /api/v1/scoring/matches/{id}` — Get match details
- `POST /api/v1/scoring/matches/{id}/toss` — Record toss
- `POST /api/v1/scoring/matches/{id}/start-innings` — Start innings
- `GET /api/v1/scoring/matches/{id}/scorecard` — Full scorecard
- `GET /api/v1/scoring/matches/{id}/live` — Live score data
- `POST /api/v1/scoring/innings/{id}/ball` — Record a ball (ball-by-ball)
- `POST /api/v1/scoring/innings/{id}/undo` — Undo last ball
- `POST /api/v1/scoring/innings/{id}/batting` — Add batting score
- `POST /api/v1/scoring/innings/{id}/bowling` — Add bowling figure
- `PATCH /api/v1/scoring/batting/{id}` — Edit batting score
- `PATCH /api/v1/scoring/bowling/{id}` — Edit bowling figure
- `POST /api/v1/scoring/innings/{id}/complete` — Complete innings
- `POST /api/v1/scoring/innings/{id}/recalculate` — Recalculate totals

### Players
- `GET /api/v1/cricpro/players` — All player profiles
- `GET /api/v1/cricpro/players/me` — My performance (authenticated)
- `GET /api/v1/cricpro/teams/{id}/players` — Players in a team

### Stats
- `GET /api/v1/stats/leaderboard/batting` — Batting leaderboard
- `GET /api/v1/stats/leaderboard/bowling` — Bowling leaderboard

---

## Architecture

```
BNI_Cricpro_integrated/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── routes/
│   │   │   ├── auth.py          # Login/refresh/logout
│   │   │   ├── cricket.py       # BNI teams/matches/groups
│   │   │   ├── scoring.py       # Ball-by-ball + admin score CRUD
│   │   │   ├── scoring_matches.py # CricPro match management
│   │   │   ├── cricpro_players.py # Player profiles + performance
│   │   │   ├── tournaments.py   # Tournament engine
│   │   │   ├── stats_admin.py   # Leaderboards + admin
│   │   │   └── ...
│   │   ├── models/models.py     # SQLAlchemy ORM (all tables)
│   │   ├── schemas/schemas.py   # Pydantic request/response
│   │   └── utils/seed.py        # Auto-seed on startup
│   ├── alembic/                  # Database migrations
│   ├── seed_teams.py            # Seed 20 teams
│   ├── seed_players.py          # Seed 20 players
│   ├── seed_matches.py          # Seed completed matches
│   └── seed_live_match.py       # Seed live match
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Entry (Redux + React Query + Router)
│   │   ├── router.tsx           # All routes
│   │   ├── components/
│   │   │   ├── MainLayout.tsx   # Public pages shell (Navbar + Footer)
│   │   │   ├── AdminLayout.tsx  # BNI Admin sidebar
│   │   │   ├── ScoringAdminLayout.tsx # CricPro Admin sidebar
│   │   │   ├── Navbar.tsx       # Unified nav (BNI + CricPro links)
│   │   │   ├── SpinnerRevealSection.tsx # Match reveal spinner
│   │   │   └── common/index.tsx # Shared UI components
│   │   ├── pages/
│   │   │   ├── admin/           # BNI admin pages (7)
│   │   │   ├── scoring/         # CricPro scoring pages (12)
│   │   │   ├── scoring-admin/   # Scoring admin pages (6)
│   │   │   └── ...              # Public BNI pages
│   │   ├── api/
│   │   │   ├── client.ts        # Axios + token interceptors
│   │   │   └── services.ts      # All API methods
│   │   ├── store/               # Redux (auth slice)
│   │   └── data/                # Tournament/team static data
│   └── index.html
└── INTEGRATION.md               # This file
```

---

## Troubleshooting

### Server stops immediately after starting
The SQL logs ending with ROLLBACK is **normal** — SQLAlchemy rolls back read-only sessions. If the server exits, check:
- PostgreSQL is running
- `.env` credentials are correct
- Run `alembic upgrade head` first

### CORS errors (OPTIONS 400)
- Check `ALLOWED_ORIGINS` in `.env` includes your frontend port
- Restart uvicorn completely (kill all instances, then restart)

### Matches not showing in Score Editor
- Ensure you're logged in as admin first (`/admin/login`)
- The token is stored in localStorage and sent via axios interceptor

### Players not selectable in Live Scoring
- Players must be in `player_profiles` table with correct `team_id`
- Run `seed_players.py` to create test players

### bcrypt/passlib error on login
- Install bcrypt 4.0.1: `pip install bcrypt==4.0.1`

---

## Quick Start (TL;DR)

```bash
# Terminal 1 — Backend
cd backend
alembic upgrade head
python seed_teams.py && python seed_matches.py && python seed_live_match.py
uvicorn app.main:app --reload --host 0.0.0.0

# Terminal 2 — Frontend  
cd frontend
npm run dev

# Open browser
# Public: http://localhost:5173
# Admin: http://localhost:5173/admin/login (admin/Admin@1234)
# Scoring: http://localhost:5173/scoring-admin
# Swagger: http://localhost:8000/docs
```
