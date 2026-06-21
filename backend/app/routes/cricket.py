
"""
Teams, Matches, Groups, Points Table, Banners, and Schedule Snapshot routes.
"""
import json
import uuid
import logging
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models import (
    Team, Match, Group, GroupTeam, PointsTableEntry, Banner,
    MatchScheduleSnapshot, GroupRevealSnapshot,
)
from app.schemas.schemas import (
    TeamCreate, TeamUpdate, TeamOut,
    MatchCreate, MatchUpdate, MatchOut,
    GroupCreate, GroupOut,
    PointsEntryUpsert, PointsEntryOut,
    BannerCreate, BannerOut,
    MatchScheduleSnapshotIn, MatchScheduleSnapshotOut,
    GroupRevealSnapshotIn, GroupRevealSnapshotOut, AllGroupRevealOut,
    ResponseEnvelope, PaginatedMeta, PaginatedResponse,
)
from app.services.minio_service import minio_service
from app.core.config import settings

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# TEAMS
# ═══════════════════════════════════════════════════════════════
teams_router = APIRouter(prefix="/teams", tags=["Teams"])


@teams_router.get("", response_model=ResponseEnvelope, summary="List all teams (public)")
async def list_teams(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Team).order_by(Team.name))).scalars().all()
    return ResponseEnvelope(data=[TeamOut.model_validate(t) for t in rows])


@teams_router.get("/{team_id}", response_model=ResponseEnvelope)
async def get_team(team_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    t = await db.get(Team, team_id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found.")
    return ResponseEnvelope(data=TeamOut.model_validate(t))


@teams_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create team (admin)")
async def create_team(
    name: str = Form(...),
    short: str = Form(...),
    captain: Optional[str] = Form(default=None),
    logo: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    existing = (await db.execute(select(Team).where(Team.short == short.upper()))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Team short code already exists.")

    logo_url = logo_key = None
    if logo and logo.filename:
        logo_key, logo_url, _ = await minio_service.upload_image(logo, prefix="team-logos")

    team = Team(name=name.strip(), short=short.upper(), captain=captain, logo_url=logo_url, logo_key=logo_key)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return ResponseEnvelope(message="Team created.", data=TeamOut.model_validate(team))


@teams_router.put("/{team_id}", response_model=ResponseEnvelope, summary="Update team (admin)")
async def update_team(
    team_id: uuid.UUID,
    name: Optional[str] = Form(default=None),
    short: Optional[str] = Form(default=None),
    captain: Optional[str] = Form(default=None),
    logo: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    team: Optional[Team] = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if name:
        team.name = name.strip()
    if short:
        team.short = short.upper()
    if captain is not None:
        team.captain = captain
    if logo and logo.filename:
        if team.logo_key:
            minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, team.logo_key)
        team.logo_key, team.logo_url, _ = await minio_service.upload_image(logo, prefix="team-logos")
    await db.commit()
    await db.refresh(team)
    return ResponseEnvelope(message="Team updated.", data=TeamOut.model_validate(team))


@teams_router.delete("/{team_id}", response_model=ResponseEnvelope, summary="Delete team (admin)")
async def delete_team(team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    team: Optional[Team] = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team.logo_key:
        minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, team.logo_key)
    await db.delete(team)
    await db.commit()
    return ResponseEnvelope(message="Team deleted.")


# ═══════════════════════════════════════════════════════════════
# MATCHES
# ═══════════════════════════════════════════════════════════════
matches_router = APIRouter(prefix="/matches", tags=["Matches"])


def _match_q():
    return select(Match).options(
        selectinload(Match.team1),
        selectinload(Match.team2),
    )


@matches_router.get("", response_model=PaginatedResponse, summary="List matches (public — scheduled only)")
async def list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    # A league match is "public" the instant both teams are assigned — the
    # exact same rule Super 12 / QF / SF / Final already use (see isScheduled()
    # on the frontend). This replaces the old is_revealed flag, which had no
    # UI control anywhere to turn it on, so scheduled matches were silently
    # stuck invisible on the public site even though the admin screens showed
    # them with real dates.
    visible = (Match.team1_id.is_not(None)) & (Match.team2_id.is_not(None))
    q = _match_q().where(visible)
    total = (await db.execute(select(func.count()).select_from(select(Match).where(visible).subquery()))).scalar_one()
    q = q.order_by(Match.slot).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return PaginatedResponse(
        data=[MatchOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@matches_router.get("/admin/all", response_model=PaginatedResponse, summary="List all matches (admin)")
async def admin_list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = _match_q()
    total = (await db.execute(select(func.count()).select_from(select(Match).subquery()))).scalar_one()
    q = q.order_by(Match.slot).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return PaginatedResponse(
        data=[MatchOut.model_validate(r) for r in rows],
        meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
    )


@matches_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create match (admin)")
async def create_match(body: MatchCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    match = Match(**body.model_dump())
    db.add(match)
    await db.commit()
    result = await db.execute(_match_q().where(Match.id == match.id))
    return ResponseEnvelope(message="Match created.", data=MatchOut.model_validate(result.scalar_one()))


@matches_router.put("/{match_id}", response_model=ResponseEnvelope, summary="Update match (admin)")
async def update_match(match_id: uuid.UUID, body: MatchUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    match: Optional[Match] = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(match, k, v)
    await db.commit()
    result = await db.execute(_match_q().where(Match.id == match_id))
    return ResponseEnvelope(message="Match updated.", data=MatchOut.model_validate(result.scalar_one()))


@matches_router.delete("/{match_id}", response_model=ResponseEnvelope, summary="Delete match (admin)")
async def delete_match(match_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    match: Optional[Match] = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")
    await db.delete(match)
    await db.commit()
    return ResponseEnvelope(message="Match deleted.")


# ═══════════════════════════════════════════════════════════════
# GROUPS
# ═══════════════════════════════════════════════════════════════
groups_router = APIRouter(prefix="/groups", tags=["Groups"])


def _group_q():
    return select(Group).options(
        selectinload(Group.teams).selectinload(GroupTeam.team)
    )


@groups_router.get("", response_model=ResponseEnvelope, summary="List all groups (public)")
async def list_groups(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(_group_q())).scalars().all()
    out = []
    for g in rows:
        teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
        d = {"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at}
        out.append(d)
    return ResponseEnvelope(data=out)


@groups_router.get("/{slug}", response_model=ResponseEnvelope)
async def get_group(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_group_q().where(Group.slug == slug))
    g: Optional[Group] = result.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found.")
    teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
    return ResponseEnvelope(data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at})


@groups_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create group (admin)")
async def create_group(body: GroupCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    # Reject duplicate name/slug with a clear 409 instead of a raw 500
    dupe = (await db.execute(
        select(Group).where((Group.name == body.name) | (Group.slug == body.slug))
    )).scalars().first()
    if dupe:
        raise HTTPException(status_code=409, detail="A group with this name or slug already exists.")

    # Validate team ids exist (avoid a foreign-key 500)
    if body.team_ids:
        found = (await db.execute(select(Team.id).where(Team.id.in_(body.team_ids)))).all()
        found_ids = {row[0] for row in found}
        missing = [str(t) for t in body.team_ids if t not in found_ids]
        if missing:
            raise HTTPException(status_code=400, detail=f"Unknown team id(s): {', '.join(missing)}")

    g = Group(name=body.name, slug=body.slug)
    db.add(g)
    await db.flush()
    for tid in body.team_ids:
        db.add(GroupTeam(group_id=g.id, team_id=tid))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Group could not be created (duplicate or constraint violation).")
    result = await db.execute(_group_q().where(Group.id == g.id))
    g = result.scalar_one()
    teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
    return ResponseEnvelope(message="Group created.", data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at})


@groups_router.delete("/{group_id}", response_model=ResponseEnvelope, summary="Delete group (admin)")
async def delete_group(group_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    g: Optional[Group] = await db.get(Group, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found.")
    await db.delete(g)
    await db.commit()
    return ResponseEnvelope(message="Group deleted.")


@groups_router.post("/{group_id}/teams/{team_id}", response_model=ResponseEnvelope, status_code=201, summary="Add team to group (admin)")
async def add_team_to_group(group_id: uuid.UUID, team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    g: Optional[Group] = await db.get(Group, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found.")
    t: Optional[Team] = await db.get(Team, team_id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found.")
    existing = (await db.execute(
        select(GroupTeam).where(GroupTeam.group_id == group_id, GroupTeam.team_id == team_id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Team already in this group.")
    db.add(GroupTeam(group_id=group_id, team_id=team_id))
    await db.commit()
    result = await db.execute(_group_q().where(Group.id == group_id))
    g = result.scalar_one()
    teams_out = [TeamOut.model_validate(gt.team) for gt in g.teams]
    return ResponseEnvelope(message="Team added to group.", data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams_out})


@groups_router.delete("/{group_id}/teams/{team_id}", response_model=ResponseEnvelope, summary="Remove team from group (admin)")
async def remove_team_from_group(group_id: uuid.UUID, team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    gt = (await db.execute(
        select(GroupTeam).where(GroupTeam.group_id == group_id, GroupTeam.team_id == team_id)
    )).scalar_one_or_none()
    if not gt:
        raise HTTPException(status_code=404, detail="Team not in this group.")
    await db.delete(gt)
    await db.commit()
    return ResponseEnvelope(message="Team removed from group.")


# ═══════════════════════════════════════════════════════════════
# POINTS TABLE
# ═══════════════════════════════════════════════════════════════
points_router = APIRouter(prefix="/points-table", tags=["Points Table"])


@points_router.get("", response_model=ResponseEnvelope, summary="Get points table (public)")
async def get_points_table(
    group_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(PointsTableEntry).options(selectinload(PointsTableEntry.team))
    if group_id:
        q = q.where(PointsTableEntry.group_id == group_id)
    q = q.order_by(PointsTableEntry.points.desc(), PointsTableEntry.nrr.desc())
    rows = (await db.execute(q)).scalars().all()
    return ResponseEnvelope(data=[PointsEntryOut.model_validate(r) for r in rows])


@points_router.post("/upsert", response_model=ResponseEnvelope, status_code=201, summary="Upsert points entry (admin)")
async def upsert_points(body: PointsEntryUpsert, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    q = select(PointsTableEntry).where(PointsTableEntry.team_id == body.team_id)
    if body.group_id:
        q = q.where(PointsTableEntry.group_id == body.group_id)
    existing: Optional[PointsTableEntry] = (await db.execute(q)).scalar_one_or_none()
    if existing:
        for k, v in body.model_dump(exclude_none=True).items():
            setattr(existing, k, v)
        entry = existing
    else:
        entry = PointsTableEntry(**body.model_dump())
        db.add(entry)
    await db.commit()
    result = await db.execute(select(PointsTableEntry).options(selectinload(PointsTableEntry.team)).where(PointsTableEntry.id == entry.id))
    return ResponseEnvelope(message="Points entry saved.", data=PointsEntryOut.model_validate(result.scalar_one()))


@points_router.delete("/{entry_id}", response_model=ResponseEnvelope, summary="Delete points entry (admin)")
async def delete_points(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    e: Optional[PointsTableEntry] = await db.get(PointsTableEntry, entry_id)
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found.")
    await db.delete(e)
    await db.commit()
    return ResponseEnvelope(message="Entry deleted.")


# ═══════════════════════════════════════════════════════════════
# BANNERS
# ═══════════════════════════════════════════════════════════════
banners_router = APIRouter(prefix="/banners", tags=["Banners"])


@banners_router.get("", response_model=ResponseEnvelope, summary="List active banners (public)")
async def list_banners(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Banner).where(Banner.is_active == True).order_by(Banner.sort_order))).scalars().all()  # noqa: E712
    return ResponseEnvelope(data=[BannerOut.model_validate(r) for r in rows])


@banners_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Upload banner (admin)")
async def create_banner(
    title: Optional[str] = Form(default=None),
    link_url: Optional[str] = Form(default=None),
    sort_order: int = Form(default=0),
    is_active: bool = Form(default=True),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    image_key, image_url, _ = await minio_service.upload_image(image, prefix="banners")
    banner = Banner(title=title, image_url=image_url, image_key=image_key, link_url=link_url, sort_order=sort_order, is_active=is_active)
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return ResponseEnvelope(message="Banner uploaded.", data=BannerOut.model_validate(banner))


@banners_router.delete("/{banner_id}", response_model=ResponseEnvelope, summary="Delete banner (admin)")
async def delete_banner(banner_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    b: Optional[Banner] = await db.get(Banner, banner_id)
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found.")
    if b.image_key:
        minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, b.image_key)
    await db.delete(b)
    await db.commit()
    return ResponseEnvelope(message="Banner deleted.")


# ═══════════════════════════════════════════════════════════════
# MATCH SCHEDULE SNAPSHOT
# ═══════════════════════════════════════════════════════════════
schedule_router = APIRouter(prefix="/schedule-snapshot", tags=["Schedule Snapshot"])


@schedule_router.get("", response_model=ResponseEnvelope, summary="Get active match schedule snapshot (public)")
async def get_snapshot(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MatchScheduleSnapshot).where(MatchScheduleSnapshot.is_active == True).order_by(MatchScheduleSnapshot.updated_at.desc())  # noqa: E712
    )
    snap: Optional[MatchScheduleSnapshot] = result.scalars().first()
    if not snap:
        return ResponseEnvelope(data=None)
    return ResponseEnvelope(data={
        "id": str(snap.id),
        "slot_to_team_name": json.loads(snap.slot_to_team_name) if snap.slot_to_team_name else [],
        "schedule_plan": json.loads(snap.schedule_plan) if snap.schedule_plan else [],
        "revealed_count": snap.revealed_count,
        "is_active": snap.is_active,
        "updated_at": snap.updated_at.isoformat(),
    })


@schedule_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Save / replace schedule snapshot (admin)")
async def save_snapshot(body: MatchScheduleSnapshotIn, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    # Deactivate previous
    prev_rows = (await db.execute(select(MatchScheduleSnapshot).where(MatchScheduleSnapshot.is_active == True))).scalars().all()  # noqa: E712
    for p in prev_rows:
        p.is_active = False

    snap = MatchScheduleSnapshot(
        slot_to_team_name=json.dumps(body.slot_to_team_name),
        schedule_plan=json.dumps(body.schedule_plan),
        revealed_count=body.revealed_count,
        is_active=True,
    )
    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    return ResponseEnvelope(message="Schedule snapshot saved.", data={
        "id": str(snap.id),
        "slot_to_team_name": json.loads(snap.slot_to_team_name),
        "schedule_plan": json.loads(snap.schedule_plan),
        "revealed_count": snap.revealed_count,
        "is_active": snap.is_active,
        "updated_at": snap.updated_at.isoformat(),
    })


@schedule_router.patch("/{snap_id}/reveal-count", response_model=ResponseEnvelope,
                       summary="Update revealed match count (admin)")
async def update_reveal_count(
    snap_id: uuid.UUID,
    revealed_count: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    snap: Optional[MatchScheduleSnapshot] = await db.get(MatchScheduleSnapshot, snap_id)
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot not found.")
    snap.revealed_count = revealed_count
    await db.commit()
    return ResponseEnvelope(message="Revealed count updated.", data={"revealed_count": snap.revealed_count})


# ═══════════════════════════════════════════════════════════════
# GROUP REVEAL SNAPSHOTS
# ═══════════════════════════════════════════════════════════════
group_reveal_router = APIRouter(prefix="/group-reveal", tags=["Group Reveal"])


@group_reveal_router.get(
    "",
    response_model=ResponseEnvelope,
    summary="Get all active group reveal snapshots (public)",
)
async def get_all_group_reveals(db: AsyncSession = Depends(get_db)):
    """
    Returns the latest active reveal snapshot for each group A-D.
    Frontend uses this to restore state on page reload.
    """
    rows = (
        await db.execute(
            select(GroupRevealSnapshot)
            .where(GroupRevealSnapshot.is_active == True)  # noqa: E712
            .order_by(GroupRevealSnapshot.group_id, GroupRevealSnapshot.updated_at.desc())
        )
    ).scalars().all()

    # Keep only the most-recent active row per group
    latest: dict[str, GroupRevealSnapshot] = {}
    for row in rows:
        if row.group_id not in latest:
            latest[row.group_id] = row

    def _fmt(snap: GroupRevealSnapshot) -> dict:
        return {
            "id": str(snap.id),
            "group_id": snap.group_id,
            "selected_team_name": snap.selected_team_name,
            "matches": json.loads(snap.matches),
            "is_active": snap.is_active,
            "created_at": snap.created_at.isoformat(),
            "updated_at": snap.updated_at.isoformat(),
        }

    return ResponseEnvelope(data={
        gid: _fmt(snap) for gid, snap in latest.items()
    })


@group_reveal_router.post(
    "",
    response_model=ResponseEnvelope,
    status_code=201,
    summary="Save / replace group reveal snapshot (public — no auth needed for live ceremony)",
)
async def save_group_reveal(body: GroupRevealSnapshotIn, db: AsyncSession = Depends(get_db)):
    """
    Called by the frontend after the spinner lands and matches are generated.
    Deactivates any previous snapshot for the same group, then inserts a new one.
    No admin auth required — this is called during the live reveal ceremony.
    """
    # Deactivate previous snapshots for this group
    prev_rows = (
        await db.execute(
            select(GroupRevealSnapshot)
            .where(
                GroupRevealSnapshot.group_id == body.group_id,
                GroupRevealSnapshot.is_active == True,  # noqa: E712
            )
        )
    ).scalars().all()
    for p in prev_rows:
        p.is_active = False

    snap = GroupRevealSnapshot(
        group_id=body.group_id,
        selected_team_name=body.selected_team_name,
        matches=json.dumps([m.model_dump() for m in body.matches]),
        is_active=True,
    )
    db.add(snap)
    await db.commit()
    await db.refresh(snap)

    return ResponseEnvelope(
        message=f"Group {body.group_id} reveal saved.",
        data={
            "id": str(snap.id),
            "group_id": snap.group_id,
            "selected_team_name": snap.selected_team_name,
            "matches": json.loads(snap.matches),
            "is_active": snap.is_active,
            "created_at": snap.created_at.isoformat(),
            "updated_at": snap.updated_at.isoformat(),
        },
    )


@group_reveal_router.delete(
    "/{group_id}",
    response_model=ResponseEnvelope,
    summary="Reset a group's reveal (admin)",
)
async def reset_group_reveal(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Deactivates all reveal snapshots for the given group."""
    rows = (
        await db.execute(
            select(GroupRevealSnapshot)
            .where(GroupRevealSnapshot.group_id == group_id.upper())
        )
    ).scalars().all()
    for r in rows:
        r.is_active = False
    await db.commit()
    return ResponseEnvelope(message=f"Group {group_id.upper()} reveal reset.")












# """
# Teams, Matches, Groups, Points Table, Banners, and Schedule Snapshot routes.
# """
# import json
# import uuid
# import logging
# from math import ceil
# from typing import Optional

# from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
# from sqlalchemy import func, select
# from sqlalchemy.exc import IntegrityError
# from sqlalchemy.orm import selectinload
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.auth import require_admin
# from app.database import get_db
# from app.models import (
#     Team, Match, Group, GroupTeam, PointsTableEntry, Banner,
#     MatchScheduleSnapshot, GroupRevealSnapshot,
# )
# from app.schemas.schemas import (
#     TeamCreate, TeamUpdate, TeamOut,
#     MatchCreate, MatchUpdate, MatchOut,
#     GroupCreate, GroupOut,
#     PointsEntryUpsert, PointsEntryOut,
#     BannerCreate, BannerOut,
#     MatchScheduleSnapshotIn, MatchScheduleSnapshotOut,
#     GroupRevealSnapshotIn, GroupRevealSnapshotOut, AllGroupRevealOut,
#     ResponseEnvelope, PaginatedMeta, PaginatedResponse,
# )
# from app.services.minio_service import minio_service
# from app.core.config import settings

# logger = logging.getLogger(__name__)

# # ═══════════════════════════════════════════════════════════════
# # TEAMS
# # ═══════════════════════════════════════════════════════════════
# teams_router = APIRouter(prefix="/teams", tags=["Teams"])


# @teams_router.get("", response_model=ResponseEnvelope, summary="List all teams (public)")
# async def list_teams(db: AsyncSession = Depends(get_db)):
#     rows = (await db.execute(select(Team).order_by(Team.name))).scalars().all()
#     return ResponseEnvelope(data=[TeamOut.model_validate(t) for t in rows])


# @teams_router.get("/{team_id}", response_model=ResponseEnvelope)
# async def get_team(team_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
#     t = await db.get(Team, team_id)
#     if not t:
#         raise HTTPException(status_code=404, detail="Team not found.")
#     return ResponseEnvelope(data=TeamOut.model_validate(t))


# @teams_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create team (admin)")
# async def create_team(
#     name: str = Form(...),
#     short: str = Form(...),
#     captain: Optional[str] = Form(default=None),
#     logo: Optional[UploadFile] = File(default=None),
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     existing = (await db.execute(select(Team).where(Team.short == short.upper()))).scalar_one_or_none()
#     if existing:
#         raise HTTPException(status_code=409, detail="Team short code already exists.")

#     logo_url = logo_key = None
#     if logo and logo.filename:
#         logo_key, logo_url, _ = await minio_service.upload_image(logo, prefix="team-logos")

#     team = Team(name=name.strip(), short=short.upper(), captain=captain, logo_url=logo_url, logo_key=logo_key)
#     db.add(team)
#     await db.commit()
#     await db.refresh(team)
#     return ResponseEnvelope(message="Team created.", data=TeamOut.model_validate(team))


# @teams_router.put("/{team_id}", response_model=ResponseEnvelope, summary="Update team (admin)")
# async def update_team(
#     team_id: uuid.UUID,
#     name: Optional[str] = Form(default=None),
#     short: Optional[str] = Form(default=None),
#     captain: Optional[str] = Form(default=None),
#     logo: Optional[UploadFile] = File(default=None),
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     team: Optional[Team] = await db.get(Team, team_id)
#     if not team:
#         raise HTTPException(status_code=404, detail="Team not found.")
#     if name:
#         team.name = name.strip()
#     if short:
#         team.short = short.upper()
#     if captain is not None:
#         team.captain = captain
#     if logo and logo.filename:
#         if team.logo_key:
#             minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, team.logo_key)
#         team.logo_key, team.logo_url, _ = await minio_service.upload_image(logo, prefix="team-logos")
#     await db.commit()
#     await db.refresh(team)
#     return ResponseEnvelope(message="Team updated.", data=TeamOut.model_validate(team))


# @teams_router.delete("/{team_id}", response_model=ResponseEnvelope, summary="Delete team (admin)")
# async def delete_team(team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     team: Optional[Team] = await db.get(Team, team_id)
#     if not team:
#         raise HTTPException(status_code=404, detail="Team not found.")
#     if team.logo_key:
#         minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, team.logo_key)
#     await db.delete(team)
#     await db.commit()
#     return ResponseEnvelope(message="Team deleted.")


# # ═══════════════════════════════════════════════════════════════
# # MATCHES
# # ═══════════════════════════════════════════════════════════════
# matches_router = APIRouter(prefix="/matches", tags=["Matches"])


# def _match_q():
#     return select(Match).options(
#         selectinload(Match.team1),
#         selectinload(Match.team2),
#     )


# @matches_router.get("", response_model=PaginatedResponse, summary="List matches (public — only revealed)")
# async def list_matches(
#     page: int = Query(1, ge=1),
#     page_size: int = Query(20, ge=1, le=100),
#     db: AsyncSession = Depends(get_db),
# ):
#     q = _match_q().where(Match.is_revealed == True)  # noqa: E712
#     total = (await db.execute(select(func.count()).select_from(select(Match).where(Match.is_revealed == True).subquery()))).scalar_one()
#     q = q.order_by(Match.slot).offset((page - 1) * page_size).limit(page_size)
#     rows = (await db.execute(q)).scalars().all()
#     return PaginatedResponse(
#         data=[MatchOut.model_validate(r) for r in rows],
#         meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
#     )


# @matches_router.get("/admin/all", response_model=PaginatedResponse, summary="List all matches (admin)")
# async def admin_list_matches(
#     page: int = Query(1, ge=1),
#     page_size: int = Query(20, ge=1, le=100),
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     q = _match_q()
#     total = (await db.execute(select(func.count()).select_from(select(Match).subquery()))).scalar_one()
#     q = q.order_by(Match.slot).offset((page - 1) * page_size).limit(page_size)
#     rows = (await db.execute(q)).scalars().all()
#     return PaginatedResponse(
#         data=[MatchOut.model_validate(r) for r in rows],
#         meta=PaginatedMeta(total=total, page=page, page_size=page_size, total_pages=ceil(total / page_size)),
#     )


# @matches_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create match (admin)")
# async def create_match(body: MatchCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     match = Match(**body.model_dump())
#     db.add(match)
#     await db.commit()
#     result = await db.execute(_match_q().where(Match.id == match.id))
#     return ResponseEnvelope(message="Match created.", data=MatchOut.model_validate(result.scalar_one()))


# @matches_router.put("/{match_id}", response_model=ResponseEnvelope, summary="Update match (admin)")
# async def update_match(match_id: uuid.UUID, body: MatchUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     match: Optional[Match] = await db.get(Match, match_id)
#     if not match:
#         raise HTTPException(status_code=404, detail="Match not found.")
#     for k, v in body.model_dump(exclude_none=True).items():
#         setattr(match, k, v)
#     await db.commit()
#     result = await db.execute(_match_q().where(Match.id == match_id))
#     return ResponseEnvelope(message="Match updated.", data=MatchOut.model_validate(result.scalar_one()))


# @matches_router.delete("/{match_id}", response_model=ResponseEnvelope, summary="Delete match (admin)")
# async def delete_match(match_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     match: Optional[Match] = await db.get(Match, match_id)
#     if not match:
#         raise HTTPException(status_code=404, detail="Match not found.")
#     await db.delete(match)
#     await db.commit()
#     return ResponseEnvelope(message="Match deleted.")


# # ═══════════════════════════════════════════════════════════════
# # GROUPS
# # ═══════════════════════════════════════════════════════════════
# groups_router = APIRouter(prefix="/groups", tags=["Groups"])


# def _group_q():
#     return select(Group).options(
#         selectinload(Group.teams).selectinload(GroupTeam.team)
#     )


# @groups_router.get("", response_model=ResponseEnvelope, summary="List all groups (public)")
# async def list_groups(db: AsyncSession = Depends(get_db)):
#     rows = (await db.execute(_group_q())).scalars().all()
#     out = []
#     for g in rows:
#         teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
#         d = {"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at}
#         out.append(d)
#     return ResponseEnvelope(data=out)


# @groups_router.get("/{slug}", response_model=ResponseEnvelope)
# async def get_group(slug: str, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(_group_q().where(Group.slug == slug))
#     g: Optional[Group] = result.scalar_one_or_none()
#     if not g:
#         raise HTTPException(status_code=404, detail="Group not found.")
#     teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
#     return ResponseEnvelope(data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at})


# @groups_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Create group (admin)")
# async def create_group(body: GroupCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     # Reject duplicate name/slug with a clear 409 instead of a raw 500
#     dupe = (await db.execute(
#         select(Group).where((Group.name == body.name) | (Group.slug == body.slug))
#     )).scalars().first()
#     if dupe:
#         raise HTTPException(status_code=409, detail="A group with this name or slug already exists.")

#     # Validate team ids exist (avoid a foreign-key 500)
#     if body.team_ids:
#         found = (await db.execute(select(Team.id).where(Team.id.in_(body.team_ids)))).all()
#         found_ids = {row[0] for row in found}
#         missing = [str(t) for t in body.team_ids if t not in found_ids]
#         if missing:
#             raise HTTPException(status_code=400, detail=f"Unknown team id(s): {', '.join(missing)}")

#     g = Group(name=body.name, slug=body.slug)
#     db.add(g)
#     await db.flush()
#     for tid in body.team_ids:
#         db.add(GroupTeam(group_id=g.id, team_id=tid))
#     try:
#         await db.commit()
#     except IntegrityError:
#         await db.rollback()
#         raise HTTPException(status_code=409, detail="Group could not be created (duplicate or constraint violation).")
#     result = await db.execute(_group_q().where(Group.id == g.id))
#     g = result.scalar_one()
#     teams = [TeamOut.model_validate(gt.team) for gt in g.teams]
#     return ResponseEnvelope(message="Group created.", data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams, "created_at": g.created_at})


# @groups_router.delete("/{group_id}", response_model=ResponseEnvelope, summary="Delete group (admin)")
# async def delete_group(group_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     g: Optional[Group] = await db.get(Group, group_id)
#     if not g:
#         raise HTTPException(status_code=404, detail="Group not found.")
#     await db.delete(g)
#     await db.commit()
#     return ResponseEnvelope(message="Group deleted.")


# @groups_router.post("/{group_id}/teams/{team_id}", response_model=ResponseEnvelope, status_code=201, summary="Add team to group (admin)")
# async def add_team_to_group(group_id: uuid.UUID, team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     g: Optional[Group] = await db.get(Group, group_id)
#     if not g:
#         raise HTTPException(status_code=404, detail="Group not found.")
#     t: Optional[Team] = await db.get(Team, team_id)
#     if not t:
#         raise HTTPException(status_code=404, detail="Team not found.")
#     existing = (await db.execute(
#         select(GroupTeam).where(GroupTeam.group_id == group_id, GroupTeam.team_id == team_id)
#     )).scalar_one_or_none()
#     if existing:
#         raise HTTPException(status_code=409, detail="Team already in this group.")
#     db.add(GroupTeam(group_id=group_id, team_id=team_id))
#     await db.commit()
#     result = await db.execute(_group_q().where(Group.id == group_id))
#     g = result.scalar_one()
#     teams_out = [TeamOut.model_validate(gt.team) for gt in g.teams]
#     return ResponseEnvelope(message="Team added to group.", data={"id": g.id, "name": g.name, "slug": g.slug, "teams": teams_out})


# @groups_router.delete("/{group_id}/teams/{team_id}", response_model=ResponseEnvelope, summary="Remove team from group (admin)")
# async def remove_team_from_group(group_id: uuid.UUID, team_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     gt = (await db.execute(
#         select(GroupTeam).where(GroupTeam.group_id == group_id, GroupTeam.team_id == team_id)
#     )).scalar_one_or_none()
#     if not gt:
#         raise HTTPException(status_code=404, detail="Team not in this group.")
#     await db.delete(gt)
#     await db.commit()
#     return ResponseEnvelope(message="Team removed from group.")


# # ═══════════════════════════════════════════════════════════════
# # POINTS TABLE
# # ═══════════════════════════════════════════════════════════════
# points_router = APIRouter(prefix="/points-table", tags=["Points Table"])


# @points_router.get("", response_model=ResponseEnvelope, summary="Get points table (public)")
# async def get_points_table(
#     group_id: Optional[uuid.UUID] = Query(None),
#     db: AsyncSession = Depends(get_db),
# ):
#     q = select(PointsTableEntry).options(selectinload(PointsTableEntry.team))
#     if group_id:
#         q = q.where(PointsTableEntry.group_id == group_id)
#     q = q.order_by(PointsTableEntry.points.desc(), PointsTableEntry.nrr.desc())
#     rows = (await db.execute(q)).scalars().all()
#     return ResponseEnvelope(data=[PointsEntryOut.model_validate(r) for r in rows])


# @points_router.post("/upsert", response_model=ResponseEnvelope, status_code=201, summary="Upsert points entry (admin)")
# async def upsert_points(body: PointsEntryUpsert, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     q = select(PointsTableEntry).where(PointsTableEntry.team_id == body.team_id)
#     if body.group_id:
#         q = q.where(PointsTableEntry.group_id == body.group_id)
#     existing: Optional[PointsTableEntry] = (await db.execute(q)).scalar_one_or_none()
#     if existing:
#         for k, v in body.model_dump(exclude_none=True).items():
#             setattr(existing, k, v)
#         entry = existing
#     else:
#         entry = PointsTableEntry(**body.model_dump())
#         db.add(entry)
#     await db.commit()
#     result = await db.execute(select(PointsTableEntry).options(selectinload(PointsTableEntry.team)).where(PointsTableEntry.id == entry.id))
#     return ResponseEnvelope(message="Points entry saved.", data=PointsEntryOut.model_validate(result.scalar_one()))


# @points_router.delete("/{entry_id}", response_model=ResponseEnvelope, summary="Delete points entry (admin)")
# async def delete_points(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     e: Optional[PointsTableEntry] = await db.get(PointsTableEntry, entry_id)
#     if not e:
#         raise HTTPException(status_code=404, detail="Entry not found.")
#     await db.delete(e)
#     await db.commit()
#     return ResponseEnvelope(message="Entry deleted.")


# # ═══════════════════════════════════════════════════════════════
# # BANNERS
# # ═══════════════════════════════════════════════════════════════
# banners_router = APIRouter(prefix="/banners", tags=["Banners"])


# @banners_router.get("", response_model=ResponseEnvelope, summary="List active banners (public)")
# async def list_banners(db: AsyncSession = Depends(get_db)):
#     rows = (await db.execute(select(Banner).where(Banner.is_active == True).order_by(Banner.sort_order))).scalars().all()  # noqa: E712
#     return ResponseEnvelope(data=[BannerOut.model_validate(r) for r in rows])


# @banners_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Upload banner (admin)")
# async def create_banner(
#     title: Optional[str] = Form(default=None),
#     link_url: Optional[str] = Form(default=None),
#     sort_order: int = Form(default=0),
#     is_active: bool = Form(default=True),
#     image: UploadFile = File(...),
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     image_key, image_url, _ = await minio_service.upload_image(image, prefix="banners")
#     banner = Banner(title=title, image_url=image_url, image_key=image_key, link_url=link_url, sort_order=sort_order, is_active=is_active)
#     db.add(banner)
#     await db.commit()
#     await db.refresh(banner)
#     return ResponseEnvelope(message="Banner uploaded.", data=BannerOut.model_validate(banner))


# @banners_router.delete("/{banner_id}", response_model=ResponseEnvelope, summary="Delete banner (admin)")
# async def delete_banner(banner_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     b: Optional[Banner] = await db.get(Banner, banner_id)
#     if not b:
#         raise HTTPException(status_code=404, detail="Banner not found.")
#     if b.image_key:
#         minio_service.delete_object(settings.MINIO_BUCKET_IMAGES, b.image_key)
#     await db.delete(b)
#     await db.commit()
#     return ResponseEnvelope(message="Banner deleted.")


# # ═══════════════════════════════════════════════════════════════
# # MATCH SCHEDULE SNAPSHOT
# # ═══════════════════════════════════════════════════════════════
# schedule_router = APIRouter(prefix="/schedule-snapshot", tags=["Schedule Snapshot"])


# @schedule_router.get("", response_model=ResponseEnvelope, summary="Get active match schedule snapshot (public)")
# async def get_snapshot(db: AsyncSession = Depends(get_db)):
#     result = await db.execute(
#         select(MatchScheduleSnapshot).where(MatchScheduleSnapshot.is_active == True).order_by(MatchScheduleSnapshot.updated_at.desc())  # noqa: E712
#     )
#     snap: Optional[MatchScheduleSnapshot] = result.scalars().first()
#     if not snap:
#         return ResponseEnvelope(data=None)
#     return ResponseEnvelope(data={
#         "id": str(snap.id),
#         "slot_to_team_name": json.loads(snap.slot_to_team_name) if snap.slot_to_team_name else [],
#         "schedule_plan": json.loads(snap.schedule_plan) if snap.schedule_plan else [],
#         "revealed_count": snap.revealed_count,
#         "is_active": snap.is_active,
#         "updated_at": snap.updated_at.isoformat(),
#     })


# @schedule_router.post("", response_model=ResponseEnvelope, status_code=201, summary="Save / replace schedule snapshot (admin)")
# async def save_snapshot(body: MatchScheduleSnapshotIn, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
#     # Deactivate previous
#     prev_rows = (await db.execute(select(MatchScheduleSnapshot).where(MatchScheduleSnapshot.is_active == True))).scalars().all()  # noqa: E712
#     for p in prev_rows:
#         p.is_active = False

#     snap = MatchScheduleSnapshot(
#         slot_to_team_name=json.dumps(body.slot_to_team_name),
#         schedule_plan=json.dumps(body.schedule_plan),
#         revealed_count=body.revealed_count,
#         is_active=True,
#     )
#     db.add(snap)
#     await db.commit()
#     await db.refresh(snap)
#     return ResponseEnvelope(message="Schedule snapshot saved.", data={
#         "id": str(snap.id),
#         "slot_to_team_name": json.loads(snap.slot_to_team_name),
#         "schedule_plan": json.loads(snap.schedule_plan),
#         "revealed_count": snap.revealed_count,
#         "is_active": snap.is_active,
#         "updated_at": snap.updated_at.isoformat(),
#     })


# @schedule_router.patch("/{snap_id}/reveal-count", response_model=ResponseEnvelope,
#                        summary="Update revealed match count (admin)")
# async def update_reveal_count(
#     snap_id: uuid.UUID,
#     revealed_count: int = Query(..., ge=0),
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     snap: Optional[MatchScheduleSnapshot] = await db.get(MatchScheduleSnapshot, snap_id)
#     if not snap:
#         raise HTTPException(status_code=404, detail="Snapshot not found.")
#     snap.revealed_count = revealed_count
#     await db.commit()
#     return ResponseEnvelope(message="Revealed count updated.", data={"revealed_count": snap.revealed_count})


# # ═══════════════════════════════════════════════════════════════
# # GROUP REVEAL SNAPSHOTS
# # ═══════════════════════════════════════════════════════════════
# group_reveal_router = APIRouter(prefix="/group-reveal", tags=["Group Reveal"])


# @group_reveal_router.get(
#     "",
#     response_model=ResponseEnvelope,
#     summary="Get all active group reveal snapshots (public)",
# )
# async def get_all_group_reveals(db: AsyncSession = Depends(get_db)):
#     """
#     Returns the latest active reveal snapshot for each group A-D.
#     Frontend uses this to restore state on page reload.
#     """
#     rows = (
#         await db.execute(
#             select(GroupRevealSnapshot)
#             .where(GroupRevealSnapshot.is_active == True)  # noqa: E712
#             .order_by(GroupRevealSnapshot.group_id, GroupRevealSnapshot.updated_at.desc())
#         )
#     ).scalars().all()

#     # Keep only the most-recent active row per group
#     latest: dict[str, GroupRevealSnapshot] = {}
#     for row in rows:
#         if row.group_id not in latest:
#             latest[row.group_id] = row

#     def _fmt(snap: GroupRevealSnapshot) -> dict:
#         return {
#             "id": str(snap.id),
#             "group_id": snap.group_id,
#             "selected_team_name": snap.selected_team_name,
#             "matches": json.loads(snap.matches),
#             "is_active": snap.is_active,
#             "created_at": snap.created_at.isoformat(),
#             "updated_at": snap.updated_at.isoformat(),
#         }

#     return ResponseEnvelope(data={
#         gid: _fmt(snap) for gid, snap in latest.items()
#     })


# @group_reveal_router.post(
#     "",
#     response_model=ResponseEnvelope,
#     status_code=201,
#     summary="Save / replace group reveal snapshot (public — no auth needed for live ceremony)",
# )
# async def save_group_reveal(body: GroupRevealSnapshotIn, db: AsyncSession = Depends(get_db)):
#     """
#     Called by the frontend after the spinner lands and matches are generated.
#     Deactivates any previous snapshot for the same group, then inserts a new one.
#     No admin auth required — this is called during the live reveal ceremony.
#     """
#     # Deactivate previous snapshots for this group
#     prev_rows = (
#         await db.execute(
#             select(GroupRevealSnapshot)
#             .where(
#                 GroupRevealSnapshot.group_id == body.group_id,
#                 GroupRevealSnapshot.is_active == True,  # noqa: E712
#             )
#         )
#     ).scalars().all()
#     for p in prev_rows:
#         p.is_active = False

#     snap = GroupRevealSnapshot(
#         group_id=body.group_id,
#         selected_team_name=body.selected_team_name,
#         matches=json.dumps([m.model_dump() for m in body.matches]),
#         is_active=True,
#     )
#     db.add(snap)
#     await db.commit()
#     await db.refresh(snap)

#     return ResponseEnvelope(
#         message=f"Group {body.group_id} reveal saved.",
#         data={
#             "id": str(snap.id),
#             "group_id": snap.group_id,
#             "selected_team_name": snap.selected_team_name,
#             "matches": json.loads(snap.matches),
#             "is_active": snap.is_active,
#             "created_at": snap.created_at.isoformat(),
#             "updated_at": snap.updated_at.isoformat(),
#         },
#     )


# @group_reveal_router.delete(
#     "/{group_id}",
#     response_model=ResponseEnvelope,
#     summary="Reset a group's reveal (admin)",
# )
# async def reset_group_reveal(
#     group_id: str,
#     db: AsyncSession = Depends(get_db),
#     _=Depends(require_admin),
# ):
#     """Deactivates all reveal snapshots for the given group."""
#     rows = (
#         await db.execute(
#             select(GroupRevealSnapshot)
#             .where(GroupRevealSnapshot.group_id == group_id.upper())
#         )
#     ).scalars().all()
#     for r in rows:
#         r.is_active = False
#     await db.commit()
#     return ResponseEnvelope(message=f"Group {group_id.upper()} reveal reset.")
