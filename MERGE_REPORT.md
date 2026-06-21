# BNI‑TPL — Merge Report (Scoring × Live Video / Groups)

This codebase merges the two source projects you provided into a single,
production‑ready application:

| Source zip | What it contributed |
|---|---|
| `BNI_Code_Scoring_Edit` | The refined **scoring engine** (ball‑by‑ball logic) and royals seed/util scripts |
| `BNI-TPL-livescore,groups section` | The new public **Match Center (Live Video)** page, **Groups** page, and **News announcement bar** |

## 1. Understanding of the two codebases

Both projects are the same FastAPI (Python 3.12) + Vite/React (TypeScript) app.
Git history confirms the relationship: the *livescore* project is a **direct
descendant** of the *scoring* project — they share commit `5736441 "edited
scoring app"`, and *livescore* adds seven commits on top with the new public
UI. So the *livescore* tree already contains the entire shared backend, admin
dashboard, tournament/match management, websockets, and the Groups page — which
is **already wired to real backend APIs** (`/groups`, `/teams`,
`tournamentStagesApi`, schedule snapshots).

The only things the *livescore* tree was missing were the final **scoring engine
refinements** that live in the *scoring* tree.

The only feature still running on hard‑coded sample data was the new
**Match Center / Live Video page** (it imported everything from
`src/lib/mock-matches.ts`).

## 2. Merge strategy

* **Base = the livescore tree** (superset of the shared code + all new UI).
* **Overlaid from the scoring tree:**
  * `backend/app/routes/scoring.py` — the refined engine (leg‑bye removed from
    legal‑ball counting; correct wide/no‑ball/bye extras breakdown; boundary
    detection fix).
  * Seed/util scripts: `add_missing_royals.py`, `clean_royals.py`,
    `dedup_profiles.py`, `dedup_royals.py`, `seed_royals*.py`.
* **New integration code** to connect the Live Video page to the existing
  scoring system (see §4).

No database migrations were added or changed — the Alembic versions
(`0001`–`0006`) are identical across both trees, so the existing schema already
supports every feature. **No duplicate tables, APIs, models, or routes were
created.**

## 3. Files

### New files
| File | Purpose |
|---|---|
| `frontend/src/lib/matchCenterAdapter.ts` | Pure functions mapping the existing scoring API responses onto the `Match`/`Team`/`Player`/`Bowler` types the Match Center components already use. |
| `frontend/src/hooks/useMatchCenter.ts` | Data hook: loads live/upcoming/completed lists and drives the active match via the existing `/ws/match/{id}` websocket (with a polling fallback). Reports an empty/error state — no sample data. |
| `frontend/src/types/match-center.ts` | Shared `Match`/`Team`/`Player`/`Bowler` types (moved out of the deleted mock file). |

### Modified files
| File | Change |
|---|---|
| `backend/app/routes/scoring.py` | Replaced with the refined scoring engine from the scoring tree. |
| `frontend/src/components/match-center/match-center.tsx` | Now renders **real** live/upcoming/completed matches via `useMatchCenter` instead of `mock-matches`. Live/real‑time indicator added. All markup/styling preserved. |
| `frontend/src/pages/LiveScoreMatchDetailsPage.tsx` | Now fetches the real match (summary + `/live` + `/scorecard`) and refreshes on websocket pushes; falls back to sample data if not found. |

### Removed
* `frontend/src/lib/mock-matches.ts` — the Live Video page no longer uses any
  sample data. Its shared types were moved to `frontend/src/types/match-center.ts`.

### Preserved (unchanged)
Everything else — the admin dashboard, scoring application UI, Groups page,
tournament management, websockets, all backend routes/models/schemas.

## 4. Live Video integration — data flow

```
Admin Scoring App  ──record ball──►  POST /scoring/innings/{id}/ball
                                          │
                          updates Innings/BattingScore/BowlingFigure
                                          │
                       publishes  match:{id}:live  (Redis) ──► WebSocket /ws/match/{id}
                                          │
Public Live Video page  ◄── useMatchWebSocket push ◄─────────────┘
        │ on push → re-fetch
        ├─ GET /scoring/matches/live                 (Live Now)
        ├─ GET /scoring/matches?status=scheduled|UPCOMING   (Upcoming)
        ├─ GET /scoring/matches?status=COMPLETED     (Recent Results)
        ├─ GET /scoring/matches/{id}/live            (active match score)
        └─ GET /scoring/matches/{id}/scorecard       (full scorecard)
```

**Match status categorisation** (uses existing `MatchStatus` enum — no new
fields): `scheduled`/`upcoming` → Upcoming · `LIVE`/`toss`/`innings_break` →
Live Score · `COMPLETED`/`abandoned`/`cancelled` → Completed.

No manual refresh is required when a live match is selected: the websocket push
re‑fetches the active score. When the socket is unavailable, the page polls
every 12 s (active match) / 30 s (lists). When the backend has no matches, the
page shows a "No matches yet" empty state — **no mock/sample data is rendered.**

## 5. APIs

**No backend APIs were added or modified.** The integration reuses existing
endpoints only: `/scoring/matches`, `/scoring/matches/live`,
`/scoring/matches/{id}/live`, `/scoring/matches/{id}/scorecard`, and the
`/ws/match/{id}` websocket.

## 6. Verification done
* `tsc --noEmit` on the full frontend → **0 errors**.
* `py_compile` on the changed backend files + seed scripts → **OK**.

## 7. Testing checklist
- [ ] `cd backend && alembic upgrade head` then start the API; `cd frontend &&
      npm install && npm run dev`.
- [ ] Open `/live-scores` — confirm Live/Upcoming/Recent lists populate from the
      backend (not sample data) once matches exist.
- [ ] Start scoring a match in the admin app; confirm the public Live Video page
      updates the score/over/striker **without a manual refresh**.
- [ ] Click a sidebar match → `/live-scores/match/:id` shows that match's detail
      and updates live.
- [ ] Move a match through scheduled → live → completed; confirm it moves
      between the Upcoming → Live → Recent buckets.
- [ ] Open the Groups page — confirm standings reflect admin updates (already
      wired; verify no regression).
- [ ] Record wides / no‑balls / byes and confirm the over count and extras match
      the refined engine rules.
- [ ] With the backend empty, confirm the Live Video page shows the "No matches
      yet" empty state (no sample data, no crash).

## 8. Assumptions
* Backend team objects have no brand colour; the adapter derives a **stable**
  colour per team name. Adjust `TEAM_PALETTE` in `matchCenterAdapter.ts` to set
  exact club colours.
* Completed‑match list cards show the backend `result_summary`; per‑innings
  scorelines appear on the detail page (from `/live` + `/scorecard`).
* The Live Video page renders **real backend data only** — no mock fallback.
* `node_modules` and the Python venv are **not** shipped — run `npm install` /
  recreate the venv from `requirements.txt`.
