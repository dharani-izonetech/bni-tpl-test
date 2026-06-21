"""
Tournament Stages API — Super12, Quarter Finals, Semi Finals, Final,
Scheduling, Bracket, and Audit Logs.

All write/admin endpoints require require_admin.
All read endpoints are public.
"""
import uuid
import logging
from datetime import date, time, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models.models import Team, Group, GroupTeam, PointsTableEntry
from app.models.tournament_stages import (
    Super12Group, Super12GroupTeam, Super12Points, Super12Match,
    QuarterFinalMatch, SemiFinalMatch, FinalMatch,
    TournamentChampion, TeamOverrideLog, MatchScheduleLog,
)
from app.schemas.schemas import ResponseEnvelope
from app.schemas.tournament_stages import (
    Super12GroupOut, Super12GroupTeamOut, Super12PointsOut, Super12MatchOut,
    Super12ResultUpdate, Super12MatchScheduleUpdate,
    QFMatchOut, SFMatchOut, FinalMatchOut,
    KOResultUpdate, KOTeamOverride, KOScheduleUpdate,
    TournamentChampionOut, ScheduleGenerateRequest,
    TeamOverrideLogOut, MatchScheduleLogOut, BracketOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tournament-stages", tags=["Tournament Stages"])


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

async def _get_league_rankings(db: AsyncSession):
    """
    Returns (qualified_teams, wildcard_pool) from league PointsTableEntry.
    qualified_teams = list of (group_slug, rank1_team_id, rank2_team_id)
    wildcard_pool   = sorted list of eliminated team entries by points/NRR/runs
    """
    groups = (await db.execute(select(Group).order_by(Group.slug))).scalars().all()
    qualified = []
    eliminated = []

    for grp in groups:
        entries = (
            await db.execute(
                select(PointsTableEntry)
                .where(PointsTableEntry.group_id == grp.id)
                .order_by(
                    PointsTableEntry.points.desc(),
                    PointsTableEntry.nrr.desc(),
                    PointsTableEntry.runs_scored.desc(),
                )
            )
        ).scalars().all()
        for rank, entry in enumerate(entries, 1):
            if rank <= 2:
                qualified.append({"group_slug": grp.slug, "rank": rank, "team_id": entry.team_id, "entry": entry})
            else:
                eliminated.append(entry)

    # Sort eliminated for wildcard selection
    eliminated.sort(key=lambda e: (-e.points, -e.nrr, -e.runs_scored))
    return qualified, eliminated


def _log_override(stage: str, action: str, prev, new, admin: str, reason: Optional[str]) -> TeamOverrideLog:
    return TeamOverrideLog(
        stage=stage, action=action,
        previous_value=str(prev) if prev is not None else None,
        new_value=str(new) if new is not None else None,
        admin_user=admin, reason=reason,
    )


def _log_schedule(stage: str, match_id: str, field: str, prev, new, admin: str, reason: Optional[str]) -> MatchScheduleLog:
    return MatchScheduleLog(
        stage=stage, match_id=match_id, field_changed=field,
        previous_value=str(prev) if prev is not None else None,
        new_value=str(new) if new is not None else None,
        admin_user=admin, reason=reason,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SUPER 12 — GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/super12/generate", response_model=ResponseEnvelope, summary="Generate Super12 groups & fixtures (admin)")
async def generate_super12(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """
    Reads league PointsTable, picks top-2 from each of 5 groups + 2 wildcards,
    assigns them to Super12 Groups A-D per the BNI TPL 2026 rules,
    and generates round-robin fixtures (3 matches per group = 12 total).
    """
    # Clear existing Super12 data
    await db.execute(delete(Super12Match))
    await db.execute(delete(Super12Points))
    await db.execute(delete(Super12GroupTeam))
    await db.execute(delete(Super12Group))
    await db.commit()

    qualified, eliminated = await _get_league_rankings(db)

    if len(qualified) < 10:
        raise HTTPException(400, "Not enough qualified teams. Complete league stage first.")

    # Map group slug -> rank -> team_id
    gmap: dict = {}
    for q in qualified:
        gmap.setdefault(q["group_slug"], {})[q["rank"]] = q["team_id"]

    # Expect groups named group-1 … group-5 (or G1…G5)
    slugs = sorted(gmap.keys())
    if len(slugs) < 5:
        raise HTTPException(400, f"Expected 5 league groups, found {len(slugs)}.")

    g1, g2, g3, g4, g5 = slugs[:5]

    wc1_id = eliminated[0].team_id if len(eliminated) > 0 else None
    wc2_id = eliminated[1].team_id if len(eliminated) > 1 else None

    # ── Group definitions per spec ──
    group_defs = {
        "A": [
            (gmap[g1].get(1), "G1W", False),
            (gmap[g5].get(1), "G5W", False),
            (gmap[g4].get(2), "G4RU", False),
        ],
        "B": [
            (gmap[g2].get(1), "G2W", False),
            (gmap[g1].get(2), "G1RU", False),
            (gmap[g5].get(2), "G5RU", False),
        ],
        "C": [
            (gmap[g3].get(1), "G3W", False),
            (gmap[g2].get(2), "G2RU", False),
            (wc1_id, "WC1", True),
        ],
        "D": [
            (gmap[g4].get(1), "G4W", False),
            (gmap[g3].get(2), "G3RU", False),
            (wc2_id, "WC2", True),
        ],
    }

    groups_created = []
    for gname, members in group_defs.items():
        grp = Super12Group(name=f"Group {gname}")
        db.add(grp)
        await db.flush()

        teams_in_group = []
        for team_id, slot, is_wc in members:
            if team_id is None:
                continue
            gt = Super12GroupTeam(group_id=grp.id, team_id=team_id, slot_label=slot, is_wildcard=is_wc)
            db.add(gt)
            pt = Super12Points(group_id=grp.id, team_id=team_id)
            db.add(pt)
            teams_in_group.append(team_id)

        # Round-robin fixtures: (0,1),(0,2),(1,2)
        for i in range(len(teams_in_group)):
            for j in range(i + 1, len(teams_in_group)):
                m = Super12Match(group_id=grp.id, team1_id=teams_in_group[i], team2_id=teams_in_group[j], overs=6)
                db.add(m)

        groups_created.append(gname)

    await db.commit()

    # Log the override
    db.add(_log_override("super12", "generate_super12", None, str(groups_created), getattr(admin, "username", "admin"), None))
    await db.commit()

    return ResponseEnvelope(message="Super12 generated successfully.", data={"groups": groups_created})


@router.get("/super12/groups", response_model=ResponseEnvelope, summary="List Super12 groups with teams & points")
async def list_super12_groups(db: AsyncSession = Depends(get_db)):
    groups = (await db.execute(select(Super12Group).order_by(Super12Group.name))).scalars().all()
    result = []
    for grp in groups:
        grp_teams = (await db.execute(select(Super12GroupTeam).where(Super12GroupTeam.group_id == grp.id))).scalars().all()
        pts = (await db.execute(
            select(Super12Points)
            .where(Super12Points.group_id == grp.id)
            .order_by(Super12Points.points.desc(), Super12Points.nrr.desc())
        )).scalars().all()
        matches = (await db.execute(select(Super12Match).where(Super12Match.group_id == grp.id))).scalars().all()
        result.append({
            "group": Super12GroupOut.model_validate(grp),
            "teams": [Super12GroupTeamOut.model_validate(t) for t in grp_teams],
            "points": [Super12PointsOut.model_validate(p) for p in pts],
            "matches": [Super12MatchOut.model_validate(m) for m in matches],
        })
    return ResponseEnvelope(data=result)


@router.get("/super12/matches", response_model=ResponseEnvelope, summary="List all Super12 matches")
async def list_super12_matches(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Super12Match).order_by(Super12Match.match_date, Super12Match.start_time))).scalars().all()
    return ResponseEnvelope(data=[Super12MatchOut.model_validate(r) for r in rows])


@router.put("/super12/matches/{match_id}/result", response_model=ResponseEnvelope, summary="Enter Super12 match result (admin)")
async def update_super12_result(
    match_id: uuid.UUID,
    payload: Super12ResultUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m: Optional[Super12Match] = await db.get(Super12Match, match_id)
    if not m:
        raise HTTPException(404, "Super12 match not found.")

    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(m, field, val)
    await db.flush()

    # Update points table if winner set
    if payload.winner_id:
        loser_id = m.team2_id if payload.winner_id == m.team1_id else m.team1_id
        for tid, won in [(payload.winner_id, True), (loser_id, False)]:
            row = (await db.execute(
                select(Super12Points).where(Super12Points.group_id == m.group_id, Super12Points.team_id == tid)
            )).scalar_one_or_none()
            if row:
                row.played += 1
                if won:
                    row.won += 1
                    row.points += 2
                else:
                    row.lost += 1
                # Update run data
                if tid == m.team1_id:
                    row.runs_for = (row.runs_for or 0) + (m.team1_score or 0)
                    row.runs_against = (row.runs_against or 0) + (m.team2_score or 0)
                    row.overs_faced = (row.overs_faced or 0.0) + (m.team1_overs or 0.0)
                    row.overs_bowled = (row.overs_bowled or 0.0) + (m.team2_overs or 0.0)
                else:
                    row.runs_for = (row.runs_for or 0) + (m.team2_score or 0)
                    row.runs_against = (row.runs_against or 0) + (m.team1_score or 0)
                    row.overs_faced = (row.overs_faced or 0.0) + (m.team2_overs or 0.0)
                    row.overs_bowled = (row.overs_bowled or 0.0) + (m.team1_overs or 0.0)
                # Recalculate NRR
                if row.overs_faced and row.overs_bowled:
                    row.nrr = (row.runs_for / row.overs_faced) - (row.runs_against / row.overs_bowled)

    await db.commit()
    return ResponseEnvelope(message="Result updated.", data=Super12MatchOut.model_validate(m))


@router.put("/super12/matches/{match_id}/schedule", response_model=ResponseEnvelope, summary="Update Super12 match schedule (admin)")
async def update_super12_schedule(
    match_id: uuid.UUID,
    payload: Super12MatchScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m: Optional[Super12Match] = await db.get(Super12Match, match_id)
    if not m:
        raise HTTPException(404, "Super12 match not found.")

    changes = payload.model_dump(exclude_none=True)
    reason = changes.pop("reason", None)
    for field, val in changes.items():
        old = getattr(m, field, None)
        if old != val:
            db.add(_log_schedule("super12", str(match_id), field, old, val, getattr(admin, "username", "admin"), reason))
        setattr(m, field, val)

    await db.commit()
    return ResponseEnvelope(message="Schedule updated.", data=Super12MatchOut.model_validate(m))


# ═══════════════════════════════════════════════════════════════════════════════
# QUARTER FINALS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/quarterfinals/generate", response_model=ResponseEnvelope, summary="Generate QF fixtures (admin)")
async def generate_quarterfinals(db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """
    Top 2 from each Super12 group (A1,A2,B1,B2,C1,C2,D1,D2).
    QF1: A1 vs D2 | QF2: A2 vs D1 | QF3: B1 vs C2 | QF4: B2 vs C1
    """
    await db.execute(delete(QuarterFinalMatch))
    await db.commit()

    groups = {
        grp.name.replace("Group ", ""): grp
        async for grp in (await db.stream(select(Super12Group).order_by(Super12Group.name)))
    }

    async def top2(group_name):
        if group_name not in groups:
            return None, None
        grp = groups[group_name]
        pts = (await db.execute(
            select(Super12Points)
            .where(Super12Points.group_id == grp.id)
            .order_by(Super12Points.points.desc(), Super12Points.nrr.desc(), Super12Points.runs_for.desc())
        )).scalars().all()
        r1 = pts[0].team_id if len(pts) > 0 else None
        r2 = pts[1].team_id if len(pts) > 1 else None
        return r1, r2

    a1, a2 = await top2("A")
    b1, b2 = await top2("B")
    c1, c2 = await top2("C")
    d1, d2 = await top2("D")

    fixtures = [
        (1, "A1 vs D2", a1, d2),
        (2, "A2 vs D1", a2, d1),
        (3, "B1 vs C2", b1, c2),
        (4, "B2 vs C1", b2, c1),
    ]
    for num, label, t1, t2 in fixtures:
        db.add(QuarterFinalMatch(match_number=num, slot_label=label, team1_id=t1, team2_id=t2, overs=8))

    await db.commit()
    db.add(_log_override("quarterfinal", "generate_qf", None, "QF1-QF4 created", getattr(admin, "username", "admin"), None))
    await db.commit()
    return ResponseEnvelope(message="Quarter Finals generated.", data={"count": 4})


@router.get("/quarterfinals", response_model=ResponseEnvelope, summary="List QF matches")
async def list_quarterfinals(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(QuarterFinalMatch).order_by(QuarterFinalMatch.match_number))).scalars().all()
    return ResponseEnvelope(data=[QFMatchOut.model_validate(r) for r in rows])


@router.put("/quarterfinals/{match_id}/result", response_model=ResponseEnvelope, summary="Enter QF result (admin)")
async def update_qf_result(
    match_id: uuid.UUID,
    payload: KOResultUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(QuarterFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "QF match not found.")
    for f, v in payload.model_dump(exclude_none=True).items():
        setattr(m, f, v)
    await db.commit()
    # Auto-propagate winner to Semi Finals if they exist
    await _propagate_qf_to_sf(db, m)
    return ResponseEnvelope(message="QF result updated.", data=QFMatchOut.model_validate(m))


@router.put("/quarterfinals/{match_id}/teams", response_model=ResponseEnvelope, summary="Override QF teams (admin)")
async def override_qf_teams(
    match_id: uuid.UUID,
    payload: KOTeamOverride,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(QuarterFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "QF match not found.")
    for f in ["team1_id", "team2_id"]:
        val = getattr(payload, f)
        if val is not None:
            old = getattr(m, f)
            db.add(_log_override("quarterfinal", f"override_{f}", old, val, getattr(admin, "username", "admin"), payload.reason))
            setattr(m, f, val)
    await db.commit()
    return ResponseEnvelope(message="QF teams updated.", data=QFMatchOut.model_validate(m))


@router.put("/quarterfinals/{match_id}/schedule", response_model=ResponseEnvelope, summary="Update QF schedule (admin)")
async def update_qf_schedule(
    match_id: uuid.UUID,
    payload: KOScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(QuarterFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "QF match not found.")
    changes = payload.model_dump(exclude_none=True)
    reason = changes.pop("reason", None)
    for field, val in changes.items():
        old = getattr(m, field, None)
        if old != val:
            db.add(_log_schedule("quarterfinal", str(match_id), field, old, val, getattr(admin, "username", "admin"), reason))
        setattr(m, field, val)
    await db.commit()
    return ResponseEnvelope(message="QF schedule updated.", data=QFMatchOut.model_validate(m))


async def _propagate_qf_to_sf(db: AsyncSession, qf: QuarterFinalMatch):
    if not qf.winner_id:
        return
    # SF1 uses QF1+QF2 winners, SF2 uses QF3+QF4 winners
    sf_num = 1 if qf.match_number in (1, 2) else 2
    sf = (await db.execute(select(SemiFinalMatch).where(SemiFinalMatch.match_number == sf_num))).scalar_one_or_none()
    if not sf:
        return
    if qf.match_number in (1, 3):
        sf.team1_id = qf.winner_id
    else:
        sf.team2_id = qf.winner_id
    await db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# SEMI FINALS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/semifinals/generate", response_model=ResponseEnvelope, summary="Generate SF fixtures (admin)")
async def generate_semifinals(db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """Creates SF1 (QF1 winner vs QF2 winner) and SF2 (QF3 winner vs QF4 winner)."""
    await db.execute(delete(SemiFinalMatch))
    await db.commit()

    qfs = {q.match_number: q for q in (await db.execute(select(QuarterFinalMatch))).scalars().all()}

    sf1 = SemiFinalMatch(
        match_number=1,
        qf1_id=qfs.get(1, type("x", (), {"id": None})()).id if 1 in qfs else None,
        qf2_id=qfs.get(2, type("x", (), {"id": None})()).id if 2 in qfs else None,
        team1_id=qfs[1].winner_id if 1 in qfs else None,
        team2_id=qfs[2].winner_id if 2 in qfs else None,
        overs=8,
    )
    sf2 = SemiFinalMatch(
        match_number=2,
        qf1_id=qfs.get(3, type("x", (), {"id": None})()).id if 3 in qfs else None,
        qf2_id=qfs.get(4, type("x", (), {"id": None})()).id if 4 in qfs else None,
        team1_id=qfs[3].winner_id if 3 in qfs else None,
        team2_id=qfs[4].winner_id if 4 in qfs else None,
        overs=8,
    )

    # Fix: use actual ids
    if 1 in qfs:
        sf1.qf1_id = qfs[1].id
    if 2 in qfs:
        sf1.qf2_id = qfs[2].id
    if 3 in qfs:
        sf2.qf1_id = qfs[3].id
    if 4 in qfs:
        sf2.qf2_id = qfs[4].id

    db.add(sf1); db.add(sf2)
    await db.commit()
    db.add(_log_override("semifinal", "generate_sf", None, "SF1,SF2 created", getattr(admin, "username", "admin"), None))
    await db.commit()
    return ResponseEnvelope(message="Semi Finals generated.", data={"count": 2})


@router.get("/semifinals", response_model=ResponseEnvelope, summary="List SF matches")
async def list_semifinals(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SemiFinalMatch).order_by(SemiFinalMatch.match_number))).scalars().all()
    return ResponseEnvelope(data=[SFMatchOut.model_validate(r) for r in rows])


@router.put("/semifinals/{match_id}/result", response_model=ResponseEnvelope, summary="Enter SF result (admin)")
async def update_sf_result(
    match_id: uuid.UUID,
    payload: KOResultUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(SemiFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "SF match not found.")
    for f, v in payload.model_dump(exclude_none=True).items():
        setattr(m, f, v)
    await db.commit()
    # Propagate to Final
    if payload.winner_id:
        await _propagate_sf_to_final(db, m)
    return ResponseEnvelope(message="SF result updated.", data=SFMatchOut.model_validate(m))


@router.put("/semifinals/{match_id}/teams", response_model=ResponseEnvelope, summary="Override SF teams (admin)")
async def override_sf_teams(
    match_id: uuid.UUID,
    payload: KOTeamOverride,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(SemiFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "SF match not found.")
    for f in ["team1_id", "team2_id"]:
        val = getattr(payload, f)
        if val is not None:
            old = getattr(m, f)
            db.add(_log_override("semifinal", f"override_{f}", old, val, getattr(admin, "username", "admin"), payload.reason))
            setattr(m, f, val)
    await db.commit()
    return ResponseEnvelope(message="SF teams updated.", data=SFMatchOut.model_validate(m))


@router.put("/semifinals/{match_id}/schedule", response_model=ResponseEnvelope, summary="Update SF schedule (admin)")
async def update_sf_schedule(
    match_id: uuid.UUID,
    payload: KOScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    m = await db.get(SemiFinalMatch, match_id)
    if not m:
        raise HTTPException(404, "SF match not found.")
    changes = payload.model_dump(exclude_none=True)
    reason = changes.pop("reason", None)
    for field, val in changes.items():
        old = getattr(m, field, None)
        if old != val:
            db.add(_log_schedule("semifinal", str(match_id), field, old, val, getattr(admin, "username", "admin"), reason))
        setattr(m, field, val)
    await db.commit()
    return ResponseEnvelope(message="SF schedule updated.", data=SFMatchOut.model_validate(m))


async def _propagate_sf_to_final(db: AsyncSession, sf: SemiFinalMatch):
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if not final:
        return
    if sf.match_number == 1:
        final.team1_id = sf.winner_id
        final.sf1_id = sf.id
    else:
        final.team2_id = sf.winner_id
        final.sf2_id = sf.id
    await db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# FINAL
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/final/generate", response_model=ResponseEnvelope, summary="Generate Final match (admin)")
async def generate_final(db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    existing = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Final already exists. Use update endpoints.")

    sfs = {s.match_number: s for s in (await db.execute(select(SemiFinalMatch))).scalars().all()}

    final = FinalMatch(
        sf1_id=sfs[1].id if 1 in sfs else None,
        sf2_id=sfs[2].id if 2 in sfs else None,
        team1_id=sfs[1].winner_id if 1 in sfs else None,
        team2_id=sfs[2].winner_id if 2 in sfs else None,
        overs=8,
    )
    db.add(final)
    await db.commit()
    db.add(_log_override("final", "generate_final", None, "Final created", getattr(admin, "username", "admin"), None))
    await db.commit()
    return ResponseEnvelope(message="Final generated.", data=FinalMatchOut.model_validate(final))


@router.get("/final", response_model=ResponseEnvelope, summary="Get Final match")
async def get_final(db: AsyncSession = Depends(get_db)):
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if not final:
        return ResponseEnvelope(data=None)
    return ResponseEnvelope(data=FinalMatchOut.model_validate(final))


@router.put("/final/result", response_model=ResponseEnvelope, summary="Enter Final result (admin)")
async def update_final_result(
    payload: KOResultUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if not final:
        raise HTTPException(404, "Final not found.")
    for f, v in payload.model_dump(exclude_none=True).items():
        setattr(final, f, v)
    await db.commit()

    # Auto-declare champion
    if payload.winner_id:
        runner_up = final.team2_id if payload.winner_id == final.team1_id else final.team1_id
        champ = (await db.execute(select(TournamentChampion))).scalar_one_or_none()
        if not champ:
            champ = TournamentChampion(champion_team_id=payload.winner_id, runner_up_team_id=runner_up)
            db.add(champ)
        else:
            champ.champion_team_id = payload.winner_id
            champ.runner_up_team_id = runner_up
        await db.commit()

    return ResponseEnvelope(message="Final result updated.", data=FinalMatchOut.model_validate(final))


@router.put("/final/teams", response_model=ResponseEnvelope, summary="Override Final teams (admin)")
async def override_final_teams(
    payload: KOTeamOverride,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if not final:
        raise HTTPException(404, "Final not found.")
    for f in ["team1_id", "team2_id"]:
        val = getattr(payload, f)
        if val is not None:
            old = getattr(final, f)
            db.add(_log_override("final", f"override_{f}", old, val, getattr(admin, "username", "admin"), payload.reason))
            setattr(final, f, val)
    await db.commit()
    return ResponseEnvelope(message="Final teams updated.", data=FinalMatchOut.model_validate(final))


@router.put("/final/schedule", response_model=ResponseEnvelope, summary="Update Final schedule (admin)")
async def update_final_schedule(
    payload: KOScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if not final:
        raise HTTPException(404, "Final not found.")
    changes = payload.model_dump(exclude_none=True)
    reason = changes.pop("reason", None)
    for field, val in changes.items():
        old = getattr(final, field, None)
        if old != val:
            db.add(_log_schedule("final", str(final.id), field, old, val, getattr(admin, "username", "admin"), reason))
        setattr(final, field, val)
    await db.commit()
    return ResponseEnvelope(message="Final schedule updated.", data=FinalMatchOut.model_validate(final))


# ═══════════════════════════════════════════════════════════════════════════════
# CHAMPION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/champion", response_model=ResponseEnvelope, summary="Get tournament champion")
async def get_champion(db: AsyncSession = Depends(get_db)):
    champ = (await db.execute(select(TournamentChampion))).scalar_one_or_none()
    if not champ:
        return ResponseEnvelope(data=None)
    return ResponseEnvelope(data=TournamentChampionOut.model_validate(champ))


# ═══════════════════════════════════════════════════════════════════════════════
# AUTO SCHEDULE
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/schedule/generate", response_model=ResponseEnvelope, summary="Auto-schedule all post-league matches (admin)")
async def generate_schedule(
    payload: ScheduleGenerateRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """
    Assigns match_date and time slots to Super12 (12 matches), QF (4), SF (2), Final (1).
    Day slots: 08:00–18:00 (60-min for S12, 90-min for KO).
    Flood-light: 18:00–23:00.
    Prevents same-team double-booking on same day/slot.
    """
    from datetime import datetime as dt

    # Day slots 60-min
    day_slots_60 = [(8 + i, 9 + i) for i in range(10)]  # 08-09, 09-10, … 17-18
    # Day slots 90-min (non-overlapping)
    day_slots_90 = [(8, 9, 30), (9, 30, 11), (11, 0, 12, 30), (12, 30, 14), (14, 0, 15, 30), (15, 30, 17), (17, 0, 18, 30)]
    fl_slots_90 = [(18, 19, 30), (19, 30, 21), (21, 0, 22, 30)]

    def to_time(h, m=0):
        return time(h, m)

    def slot_conflict(booked: dict, d: date, team1, team2, start: time, end: time) -> bool:
        for entry in booked.get(d, []):
            if team1 in entry["teams"] or team2 in entry["teams"]:
                if not (end <= entry["start"] or start >= entry["end"]):
                    return True
        return False

    def next_free_slot_60(booked, d, t1, t2, floodlight=False):
        slots = [(to_time(18 + i), to_time(19 + i)) for i in range(5)] if floodlight else [(to_time(8 + i), to_time(9 + i)) for i in range(10)]
        for s, e in slots:
            if not slot_conflict(booked, d, t1, t2, s, e):
                return s, e
        return None, None

    def next_free_slot_90(booked, d, t1, t2, floodlight=False):
        if floodlight:
            slots = [(to_time(18), to_time(19, 30)), (to_time(19, 30), to_time(21)), (to_time(21), to_time(22, 30))]
        else:
            slots = [(to_time(8), to_time(9, 30)), (to_time(9, 30), to_time(11)),
                     (to_time(11), to_time(12, 30)), (to_time(12, 30), to_time(14)),
                     (to_time(14), to_time(15, 30)), (to_time(15, 30), to_time(17))]
        for s, e in slots:
            if not slot_conflict(booked, d, t1, t2, s, e):
                return s, e
        return None, None

    booked: dict = {}
    current_date = payload.start_date
    prefer_fl = payload.prefer_floodlight

    def assign_match(match, duration_mins: int):
        nonlocal current_date
        for attempt in range(60):  # max 60 days ahead
            d = current_date + timedelta(days=attempt)
            if prefer_fl:
                fn = next_free_slot_90 if duration_mins == 90 else next_free_slot_60
                s, e = fn(booked, d, match.team1_id, match.team2_id, floodlight=True)
                if s is None:
                    s, e = fn(booked, d, match.team1_id, match.team2_id, floodlight=False)
            else:
                fn = next_free_slot_90 if duration_mins == 90 else next_free_slot_60
                s, e = fn(booked, d, match.team1_id, match.team2_id, floodlight=False)
                if s is None:
                    s, e = fn(booked, d, match.team1_id, match.team2_id, floodlight=True)
            if s is not None:
                match.match_date = d
                match.start_time = s
                match.end_time = e
                match.match_type = "floodlight" if s.hour >= 18 else "day"
                match.schedule_status = "scheduled"
                booked.setdefault(d, []).append({"teams": {match.team1_id, match.team2_id}, "start": s, "end": e})
                return True
        return False

    # Schedule Super12
    s12_matches = (await db.execute(select(Super12Match).order_by(Super12Match.group_id))).scalars().all()
    for m in s12_matches:
        assign_match(m, 60)

    # Advance date to after S12 estimated end
    if s12_matches:
        last_s12 = max(m.match_date for m in s12_matches if m.match_date)
        current_date = last_s12 + timedelta(days=1)

    # Schedule QF
    qf_matches = (await db.execute(select(QuarterFinalMatch).order_by(QuarterFinalMatch.match_number))).scalars().all()
    for m in qf_matches:
        assign_match(m, 90)

    if qf_matches:
        last_qf = max(m.match_date for m in qf_matches if m.match_date)
        current_date = last_qf + timedelta(days=1)

    # Schedule SF
    sf_matches = (await db.execute(select(SemiFinalMatch).order_by(SemiFinalMatch.match_number))).scalars().all()
    for m in sf_matches:
        assign_match(m, 90)

    if sf_matches:
        last_sf = max(m.match_date for m in sf_matches if m.match_date)
        current_date = last_sf + timedelta(days=2)

    # Schedule Final
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    if final:
        assign_match(final, 90)

    await db.commit()
    db.add(_log_override("super12", "generate_schedule", None, str(payload.start_date), getattr(admin, "username", "admin"), None))
    await db.commit()
    return ResponseEnvelope(message="Schedule generated successfully.")


# ═══════════════════════════════════════════════════════════════════════════════
# BRACKET
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/bracket", response_model=ResponseEnvelope, summary="Full tournament bracket")
async def get_bracket(db: AsyncSession = Depends(get_db)):
    groups = (await db.execute(select(Super12Group).order_by(Super12Group.name))).scalars().all()
    s12_data = []
    for grp in groups:
        pts = (await db.execute(
            select(Super12Points).where(Super12Points.group_id == grp.id)
            .order_by(Super12Points.points.desc(), Super12Points.nrr.desc())
        )).scalars().all()
        matches = (await db.execute(select(Super12Match).where(Super12Match.group_id == grp.id))).scalars().all()
        s12_data.append({
            "group": Super12GroupOut.model_validate(grp),
            "points": [Super12PointsOut.model_validate(p) for p in pts],
            "matches": [Super12MatchOut.model_validate(m) for m in matches],
        })

    qfs = (await db.execute(select(QuarterFinalMatch).order_by(QuarterFinalMatch.match_number))).scalars().all()
    sfs = (await db.execute(select(SemiFinalMatch).order_by(SemiFinalMatch.match_number))).scalars().all()
    final = (await db.execute(select(FinalMatch))).scalar_one_or_none()
    champ = (await db.execute(select(TournamentChampion))).scalar_one_or_none()

    return ResponseEnvelope(data=BracketOut(
        super12_groups=s12_data,
        quarter_finals=[QFMatchOut.model_validate(q) for q in qfs],
        semi_finals=[SFMatchOut.model_validate(s) for s in sfs],
        final=FinalMatchOut.model_validate(final) if final else None,
        champion=TournamentChampionOut.model_validate(champ) if champ else None,
    ))


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit/overrides", response_model=ResponseEnvelope, summary="Team override audit log (admin)")
async def list_override_logs(
    stage: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    q = select(TeamOverrideLog).order_by(TeamOverrideLog.created_at.desc()).limit(limit)
    if stage:
        q = q.where(TeamOverrideLog.stage == stage)
    rows = (await db.execute(q)).scalars().all()
    return ResponseEnvelope(data=[TeamOverrideLogOut.model_validate(r) for r in rows])


@router.get("/audit/schedules", response_model=ResponseEnvelope, summary="Schedule change audit log (admin)")
async def list_schedule_logs(
    stage: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    q = select(MatchScheduleLog).order_by(MatchScheduleLog.created_at.desc()).limit(limit)
    if stage:
        q = q.where(MatchScheduleLog.stage == stage)
    rows = (await db.execute(q)).scalars().all()
    return ResponseEnvelope(data=[MatchScheduleLogOut.model_validate(r) for r in rows])
