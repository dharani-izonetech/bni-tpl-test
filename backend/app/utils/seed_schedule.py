"""
Seed / update the BNI-TPL 2026 match schedule (timings + fixtures).

Transcribed from the official fixture sheet:

  25 June — 14 league matches (M18, M6, M8, M19, M24, M1, M29, M13, M26,
                               M4, M14, M10, M28, M9)
  26 June — 14 league matches (M22, M5, M16, M30, M7, M12, M15, M21, M11,
                               M3, M20, M23, M27, M17)
  27 June — M25, M2  then Super-12 (S1..S12)
  28 June — QF1..QF4, SF1..SF2, FINAL

The 30 LEAGUE matches (M1..M30) have known teams + date + time, so they are
upserted into the `matches` table by match_number (idempotent — safe to re-run).

The SUPER-12 and KNOCKOUT rows are *generated from league results* by the
existing endpoints (/super12/generate, /quarterfinals/generate, ...). They have
no fixed teams in the fixture sheet, so this script only *time-stamps* them, and
only the rows that already exist. Run the generate endpoints first, then re-run
this with --stages.

USAGE
  cd backend
  python -m app.utils.seed_schedule            # upsert the 30 league fixtures
  python -m app.utils.seed_schedule --dry-run  # show what would change, no writes
  python -m app.utils.seed_schedule --stages   # also time-stamp existing S12/KO rows

IMPORTANT — verify before trusting:
  * The fixture sheet uses bare team names ("Royals"); your DB stores "BNI Royals".
    The resolver tries both "BNI <name>" and bare "<name>", so either form works.
  * Team names ("Jaaguar", "Victory", etc.) are matched directly — the resolver
    tries both "BNI <name>" and bare "<name>", so either storage form works.
  * All times are interpreted as IST (Asia/Kolkata, UTC+05:30). The ">" prefix on
    the sheet just marks the evening session (18:00+); times below are 24-hour.
"""
from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timezone, timedelta, date as _date, time as _time

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database.session import AsyncSessionLocal
from app.models.models import Match, Team, Tournament, MatchStatus

IST = timezone(timedelta(hours=5, minutes=30))
YEAR = 2026

# ── Team name resolution ────────────────────────────────────────────────────
# Spelling fixes only (the sheet spells some names differently from the DB).
# The resolver below tries both the "BNI <name>" and bare "<name>" forms, so it
# works whether your team is stored as "BNI Victory" or just "Victory".
TEAM_ALIASES: dict[str, str] = {}   # no spelling remaps needed


def _candidates(sheet_name: str) -> list[str]:
    """Candidate DB names to try, in priority order."""
    raw = sheet_name.strip()
    base = TEAM_ALIASES.get(raw, raw)
    out: list[str] = []
    for n in (base, raw):
        for form in (n if n.upper().startswith("BNI ") else f"BNI {n}", n):
            if form.lower() not in {o.lower() for o in out}:
                out.append(form)
    return out


def _db_name(sheet_name: str) -> str:
    """Preferred display form (first candidate) — used for unresolved reporting."""
    return _candidates(sheet_name)[0]


# ── League fixtures: (match_number, day, "HH:MM", team1, team2) ──────────────
LEAGUE_FIXTURES = [
    # 25 June
    (18, 25, "09:00", "Royals", "Dynamic"),
    (6,  25, "10:00", "Legends", "Gladiators"),
    (8,  25, "11:00", "Harmony", "Benchmark"),
    (19, 25, "12:00", "Azpire", "Warriors"),
    (24, 25, "13:00", "Oscar", "Spark"),
    (1,  25, "14:00", "Icons", "Champions"),
    (29, 25, "15:00", "Fortune", "Prince"),
    (13, 25, "16:00", "Jaaguar", "Victory"),
    (26, 25, "17:00", "Kings", "Millionaire"),
    (4,  25, "18:00", "Champions", "Legends"),
    (14, 25, "19:00", "Jaaguar", "Royals"),
    (10, 25, "20:00", "Emperor", "Benchmark"),
    (28, 25, "21:00", "Fortune", "Millionaire"),
    (9,  25, "22:00", "Harmony", "Nest"),
    # 26 June
    (22, 26, "08:00", "Warriors", "Oscar"),
    (5,  26, "09:00", "Champions", "Gladiators"),
    (16, 26, "10:00", "Victory", "Royals"),
    (30, 26, "11:00", "Millionaire", "Prince"),
    (7,  26, "12:00", "Harmony", "Emperor"),
    (12, 26, "13:00", "Benchmark", "Nest"),
    (15, 26, "14:00", "Jaaguar", "Dynamic"),
    (21, 26, "15:00", "Azpire", "Spark"),
    (11, 26, "16:00", "Emperor", "Nest"),
    (3,  26, "17:00", "Icons", "Gladiators"),
    (20, 26, "18:00", "Azpire", "Oscar"),
    (23, 26, "19:00", "Warriors", "Spark"),
    (27, 26, "20:00", "Kings", "Prince"),
    (17, 26, "21:00", "Victory", "Dynamic"),
    # 27 June
    (25, 27, "08:00", "Kings", "Fortune"),
    (2,  27, "09:00", "Icons", "Legends"),
]

# ── Stage time slots (no teams in the sheet) ────────────────────────────────
# label -> (day, "HH:MM").  Used only by --stages to time-stamp existing rows.
SUPER12_TIMES = {f"S{i}": (27, f"{9 + i:02d}:00") for i in range(1, 13)}  # S1=10:00 .. S12=21:00
KNOCKOUT_TIMES = {
    "QF1": (28, "08:00"), "QF2": (28, "09:00"), "QF3": (28, "10:00"), "QF4": (28, "11:00"),
    "SF1": (28, "14:00"), "SF2": (28, "16:00"),
    "FINAL": (28, "20:00"),
}


def _dt(day: int, hhmm: str) -> datetime:
    h, m = map(int, hhmm.split(":"))
    return datetime(YEAR, 6, day, h, m, tzinfo=IST)


async def seed_league(db, *, dry_run: bool) -> None:
    teams = (await db.execute(select(Team))).scalars().all()
    by_name = {t.name.lower(): t for t in teams}

    tournament = (await db.execute(select(Tournament).order_by(Tournament.id))).scalars().first()
    tid = tournament.id if tournament else None

    def resolve(sheet_name: str):
        for cand in _candidates(sheet_name):
            t = by_name.get(cand.lower())
            if t is not None:
                return t
        return None

    unresolved: set[str] = set()
    created = updated = 0

    # The public /matches list returns only is_revealed=True rows, ordered by
    # `slot`. Assign a deterministic chronological slot (earliest match = 1) and
    # reveal the fixtures so they appear, in order, on the public Matches page.
    chrono = sorted(LEAGUE_FIXTURES, key=lambda f: (f[1], f[2]))
    slot_by_number = {f[0]: i + 1 for i, f in enumerate(chrono)}

    for number, day, hhmm, t1, t2 in LEAGUE_FIXTURES:
        team1, team2 = resolve(t1), resolve(t2)
        if team1 is None:
            unresolved.add(f"{t1} -> {_db_name(t1)}")
        if team2 is None:
            unresolved.add(f"{t2} -> {_db_name(t2)}")
        if team1 is None or team2 is None:
            continue

        when = _dt(day, hhmm)
        slot = slot_by_number[number]
        existing = (await db.execute(
            select(Match).where(Match.match_number == number, Match.match_type == "league")
        )).scalars().first()

        if existing:
            existing.team1_id = team1.id
            existing.team2_id = team2.id
            existing.match_date = when
            existing.match_type = "league"
            existing.slot = slot
            existing.is_revealed = True
            if existing.status not in (MatchStatus.live, MatchStatus.completed):
                existing.status = MatchStatus.upcoming
            if tid and existing.tournament_id is None:
                existing.tournament_id = tid
            updated += 1
        else:
            db.add(Match(
                match_number=number,
                match_type="league",
                team1_id=team1.id,
                team2_id=team2.id,
                match_date=when,
                status=MatchStatus.upcoming,
                overs=20,
                tournament_id=tid,
                slot=slot,
                is_revealed=True,
            ))
            created += 1

    if unresolved:
        print("\n⚠️  UNRESOLVED TEAMS — these fixtures were skipped:")
        for u in sorted(unresolved):
            print(f"     {u}   (not found in `teams`)")
        print("   Fix the team name in your DB or adjust TEAM_ALIASES, then re-run.\n")

    if dry_run:
        print(f"[dry-run] would create {created}, update {updated} league matches. Rolling back.")
        await db.rollback()
    else:
        try:
            await db.commit()
        except IntegrityError as e:
            await db.rollback()
            print(f"❌ Seed failed on a unique constraint — most likely an existing match already "
                  f"uses one of slots 1–{len(LEAGUE_FIXTURES)}. Clear those matches (or their slots) "
                  f"and re-run. Details: {getattr(e, 'orig', e)}")
            return
        print(f"✅ League schedule seeded: {created} created, {updated} updated "
              f"({created + updated}/{len(LEAGUE_FIXTURES)} fixtures). Revealed & slotted in date order.")


async def stamp_stages(db, *, dry_run: bool) -> None:
    """Best-effort: set date/time on already-generated Super-12 & knockout rows."""
    from app.models.tournament_stages import (
        Super12Match, QuarterFinalMatch, SemiFinalMatch, FinalMatch,
    )

    def split(day, hhmm):
        h, m = map(int, hhmm.split(":"))
        return _date(YEAR, 6, day), _time(h, m)

    touched = 0

    # Super-12: matches have no slot label; assign S1..S12 by creation order.
    s12 = (await db.execute(select(Super12Match).order_by(Super12Match.created_at))).scalars().all()
    for i, mt in enumerate(s12, start=1):
        slot = SUPER12_TIMES.get(f"S{i}")
        if slot:
            d, t = split(*slot)
            mt.match_date, mt.start_time = d, t
            touched += 1

    # Quarter-finals by slot_label / match_number
    qfs = (await db.execute(select(QuarterFinalMatch))).scalars().all()
    for mt in qfs:
        label = (mt.slot_label or f"QF{mt.match_number}").upper()
        slot = KNOCKOUT_TIMES.get(label)
        if slot:
            d, t = split(*slot)
            mt.match_date, mt.start_time = d, t
            touched += 1

    # Semi-finals
    sfs = (await db.execute(select(SemiFinalMatch))).scalars().all()
    for mt in sfs:
        label = (getattr(mt, "slot_label", None) or f"SF{getattr(mt, 'match_number', '')}").upper()
        slot = KNOCKOUT_TIMES.get(label)
        if slot:
            d, t = split(*slot)
            mt.match_date, mt.start_time = d, t
            touched += 1

    # Final
    finals = (await db.execute(select(FinalMatch))).scalars().all()
    for mt in finals:
        d, t = split(*KNOCKOUT_TIMES["FINAL"])
        mt.match_date, mt.start_time = d, t
        touched += 1

    if dry_run:
        print(f"[dry-run] would time-stamp {touched} stage matches. Rolling back.")
        await db.rollback()
    else:
        await db.commit()
        print(f"✅ Stage times set on {touched} existing Super-12/knockout rows.")
    if not (s12 or qfs or sfs or finals):
        print("   (No Super-12/knockout rows exist yet — generate them first, then re-run --stages.)")


async def main(dry_run: bool, stages: bool) -> None:
    async with AsyncSessionLocal() as db:
        await seed_league(db, dry_run=dry_run)
        if stages:
            await stamp_stages(db, dry_run=dry_run)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Seed the BNI-TPL 2026 match schedule.")
    ap.add_argument("--dry-run", action="store_true", help="show changes without writing")
    ap.add_argument("--stages", action="store_true", help="also time-stamp existing Super-12/knockout rows")
    args = ap.parse_args()
    asyncio.run(main(args.dry_run, args.stages))
