# CHANGES — Cricket Scoring Feature Enhancement Pass

This pass treated the existing codebase as the source of truth and closed the
remaining gaps against the requirements spec. The backend already implemented
all 10 features to production grade; the frontend already wired Features 1, 2, 7
and 8 into the live scoring page. The work below is minimal and targeted — no
existing functionality, API contracts, DB relations or public pages were
removed.

## Backend

### New — `app/services/scoring_logic.py`
A pure, dependency-free rules module (no FastAPI / SQLAlchemy / Redis imports) so
the core scoring rules can be unit-tested in isolation:
- `compute_runs_breakdown` — runs split incl. **leg-bye scoring (Feature 3)**
- `apply_bounce_rule` — **over bounce rule (Feature 2)**: 1st bounce warns,
  2nd converts to no-ball with +1 extra
- `resolve_dismissed_player` — **non-striker wicket resolution (Feature 1)**
- `bowler_credited_with_wicket` / `counts_against_wickets` — wicket attribution
- `build_commentary` — **captain/VC markers (Feature 6)** + **detailed wicket
  attribution (Feature 7)** (bowled / c-fielder / c-keeper / stumped / run-out
  single & multiple fielders / non-striker)
- `calculate_overs`, `is_legal_ball`, `counts_as_ball_faced`, `strike_rate`,
  `captain_tag`

### Changed — `app/routes/scoring.py`
- `record_ball` now delegates to `scoring_logic` for the runs breakdown, bounce
  rule, dismissed-player resolution, wicket counting, bowler credit and
  commentary — single source of truth, behaviour preserved.
- **Bug fix (leg-bye undo):** `undo_last_ball` now reverses `extras_leg_bye`,
  includes `leg_bye` in the legal-ball recount, and decrements balls-faced for
  leg byes (previously inconsistent with `record_ball`).

### New — `backend/tests/test_scoring_rules.py`
37 unit tests (all passing, no DB required) covering: 1/2/3/4 leg byes, both
bounce cases, non-striker & run-out resolution, every wicket-attribution
commentary form, captain/VC markers, the 137.93 strike-rate example, and overs
maths. Run with: `pytest backend/tests/test_scoring_rules.py -v`.

## Frontend

### Changed — `src/api/services.ts`
- `playersApi` extended with `get`, `create`, `remove`, `teams`, `users`, and
  `is_vice_captain` / `is_active` on update (full **Player CRUD — Feature 4**).
- `scoringApi.recordBall` payload type extended with `dismissed_is_non_striker`,
  `fielder2_id`, `wicket_keeper_id`, `is_bounce` (Features 1, 2, 7).

### Changed — `src/pages/scoring-admin/PlayersPage.tsx`
- Added a **Create Player** modal (user + team + role + batting/bowling style +
  jersey + Captain/Vice-Captain/Wicket-Keeper flags) and a **Delete** action with
  confirmation. Edit row gains Captain/VC/WK toggles; list rows show (C)/(VC)/(WK)
  badges. Previously the page was edit-only.

### Changed — `src/types/cricpro.ts`
- `DismissalType` union extended with `handled_ball`, `obstructing_field`,
  `timed_out` so the live scoring page type-checks.

## Verification performed here
- `tsc --noEmit` (frontend): **0 errors**.
- Backend `compileall` + full `app.main` import: **OK (143 routes)**.
- `pytest`: **37 passed**.

## Not verified in this environment
- Live end-to-end run (no Postgres / Redis / browser available here).
- `vite build` and a clean `pip install -r requirements.txt` — the committed
  `bnivenv/` is Windows-only; recreate the venv on your platform.

## Packaging note
The delivered zip **excludes** regenerable/heavy dirs to keep it usable:
`node_modules/`, `backend/bnivenv/`, `.git/`, `__pycache__/`, `*.pyc`, `dist/`.
Restore with `npm install` (frontend) and a fresh venv + `pip install -r
requirements.txt` (backend).

---

## Schedule seed — BNI-TPL 2026 fixtures & timings

New: `backend/app/utils/seed_schedule.py` — idempotent seeder transcribed from the
official fixture sheet (25–28 June 2026).

- Upserts the **30 league matches (M1–M30)** into the `matches` table by
  `match_number` (teams + IST date/time + status=UPCOMING + 20 overs). Re-runnable.
- Validated: 30 unique matches covering M1–M30, all 20 teams resolve, each team
  plays exactly 3 league games.
- Team-name handling: resolver tries both `BNI <name>` and bare `<name>`; `Jaaquar` →
  `BNI Jaaguar` (spelling). `Victory` is kept as-is (resolves to `BNI Victory` or `Victory`).
- Super-12 (S1–S12) and knockout (QF/SF/Final) carry **times only** in the sheet and
  are generated from results; `--stages` time-stamps those rows *if they already exist*
  (generate them first via the existing endpoints).

Run:
```bash
cd backend
python -m app.utils.seed_schedule --dry-run   # preview, no writes
python -m app.utils.seed_schedule             # upsert the 30 league fixtures
python -m app.utils.seed_schedule --stages    # also time-stamp existing S12/KO rows
```

Note: requires the player/schedule schema to be present (apply migration `0007`
first if you hit a missing-column error), and must run against your live DB — it
could not be executed in the build environment.

---

## Public Matches page — show seeded date/time

`frontend/src/pages/MatchesPage.tsx` now displays each match's scheduled date/time
(IST) on its card, keeping the existing group layout. The page builds league
fixtures from the reveal snapshot (team names, group-order numbers), so it joins
to the seeded `matches` table by **normalised team pair** (not match number) — a
new `GET /matches` fetch builds a `pairKey(team1,team2) → match_date` lookup, and
`MatchCard` renders a "🕒 25 Jun, 9:00 am" pill when a date is found (and nothing
when it isn't, so unrevealed/ungenerated stages stay clean). League dates come
from the seed; Super-12/knockout cards will show times once those stage rows
carry dates and are surfaced by the bracket endpoint.
