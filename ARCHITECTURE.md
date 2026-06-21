# BNI Cricket — Database Architecture & Player Sync

## Recommended Architecture

```
PostgreSQL Database: bni_cricket
├── Schema: bni_registration (Registration Website — source of truth)
│   ├── players          ← registered player data
│   ├── registrations
│   └── users
│
└── Schema: bni (Cricket Tournament Website — independent operations)
    ├── users            ← cricket system auth accounts
    ├── registered_players ← imported snapshot from registration
    ├── player_profiles  ← scoring entity linked to users + teams
    ├── teams
    ├── groups / group_teams
    ├── matches
    ├── innings / balls / batting_scores / bowling_figures
    ├── tournaments
    ├── player_career_stats
    └── ... (all cricket-specific tables)
```

## Architecture Decisions

### 1. Separate Schemas ✅ (Recommended)

- `bni_registration` — owned by Registration Website, never modified by Cricket app
- `bni` — owned by Cricket Website, full autonomy for tournament operations

**Why:** Clean ownership boundaries. Each app controls its own schema.
The cricket app doesn't need write access to registration tables.

### 2. Player Data Strategy: **Read-only cross-schema access + import snapshot**

The cricket website should:
1. **READ** from `bni_registration.players` via a cross-schema query (same database, no network hop)
2. **IMPORT** player data into `bni.registered_players` as a denormalized snapshot
3. **CREATE** `bni.users` + `bni.player_profiles` entries for the scoring engine

**Why this hybrid approach:**
- Direct cross-schema read gives real-time access without sync lag
- The import snapshot provides independence if schemas diverge or registration DB goes offline
- The cricket schema can add cricket-specific fields (team assignment, jersey number, stats)
- No circular dependencies between systems

### 3. Excel File: **Backup only, not primary source**

- The hosted PostgreSQL `bni_registration.players` table is the single source of truth
- Excel is an emergency fallback if the database is unavailable
- The sync script supports both: DB-to-DB (primary) and Excel import (fallback)

---

## Sync Process Flow

```
┌─────────────────────┐         ┌──────────────────────────────┐
│ bni_registration    │         │ bni (cricket schema)         │
│ .players            │ ──READ──▶ registered_players            │
│                     │         │       │                      │
│ (source of truth)   │         │       ▼                      │
│                     │         │ users + player_profiles       │
│                     │         │ (scoring-ready entities)      │
└─────────────────────┘         └──────────────────────────────┘
```

### Sync Rules:
1. Match on `phone_no` (unique identifier from registration)
2. Store `registration_id` (original UUID from bni_registration.players)
3. Upsert — update existing, insert new, never delete
4. Idempotent — safe to run multiple times
5. Logged — track sync timestamp and count

---

## Implementation Files

| File | Purpose |
|------|---------|
| `backend/app/services/player_sync.py` | Sync service (DB→DB and Excel fallback) |
| `backend/sync_players.py` | CLI script to run sync |
| `backend/alembic/versions/0006_registration_link.py` | Migration: add registration_id column |

---

## Preventing Duplicates

The `registered_players` table uses:
- `UNIQUE(phone_no)` — prevents duplicate phone numbers
- `registration_id` column — stores the original UUID from `bni_registration.players`
- Upsert logic: `INSERT ... ON CONFLICT (phone_no) DO UPDATE`

The sync service checks before insert and updates existing records.
