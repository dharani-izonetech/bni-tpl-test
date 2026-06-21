"""
BNI Cricket + CricPro — Unified FastAPI application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.middleware.logging_middleware import log_requests
from app.database import engine
from app.database.session import Base
from app.utils.logging_setup import setup_logging
from app.utils.seed import seed_admin, seed_teams
from app.database import AsyncSessionLocal

# ── BNI routes ──────────────────────────────────────────────────────────────
from app.routes import (
    auth_router, players_router, news_router, live_scores_router,
    media_router, admin_users_router,
    teams_router, matches_router, groups_router, points_router,
    banners_router, schedule_router,
)
from app.routes.cricket import group_reveal_router

# ── CricPro routes ──────────────────────────────────────────────────────────
from app.routes.scoring import router as scoring_router
from app.routes.scoring_matches import router as scoring_matches_router
from app.routes.cricpro_players import router as cricpro_players_router
from app.routes.tournaments import router as tournaments_router
from app.routes.player_profiles import router as player_profiles_router
from app.routes.stats import router as stats_router
from app.routes.stats_admin import stats_router as stats_admin_router, admin_router as admin_extra_router, notifications_router
from app.routes.tournament_stages import router as tournament_stages_router

# ── WebSocket (CricPro) ─────────────────────────────────────────────────────
from app.websockets.routes import router as ws_router

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio

    # ── Migrations: skipped on startup to avoid blocking on remote DB ──────
    # Run manually: `alembic upgrade head`
    # ────────────────────────────────────────────────────────────────────────

    try:
        async with engine.begin() as conn:
            await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.POSTGRES_SCHEMA}"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        logger.warning("Schema/table creation failed (non-fatal): %s", exc)

    try:
        async with AsyncSessionLocal() as db:
            await seed_admin(db)
            await seed_teams(db)
    except Exception as exc:
        logger.warning("Seed failed (non-fatal): %s", exc)

    # Ensure media directory exists (CricPro static files)
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    os.makedirs("./logs", exist_ok=True)

    # Optional Redis startup
    try:
        from app.db.redis import get_redis
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connected.")
    except Exception as e:
        logger.warning("Redis not available (scoring pub/sub disabled): %s", e)

    logger.info("BNI+CricPro API started — env=%s", settings.APP_ENV)
    yield

    await engine.dispose()
    try:
        from app.db.redis import close_redis
        await close_redis()
    except Exception:
        pass
    logger.info("API shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description=(
        "## BNI Cricket + CricPro API\n\n"
        "Integrated tournament website with live scoring engine.\n\n"
        "### Authentication\n"
        "Most endpoints require a **Bearer JWT token**. "
        "Use `POST /api/v1/auth/login` to get a token, then click **Authorize** above and enter `Bearer <token>`.\n\n"
        "### Modules\n"
        "- **Auth** — login, refresh, logout, current user\n"
        "- **Players** — BNI registered players\n"
        "- **Teams** — team management\n"
        "- **Matches** — match scheduling & results\n"
        "- **Live Scores** — BNI live score widget\n"
        "- **Tournaments** — CricPro tournament engine\n"
        "- **Scoring** — ball-by-ball live scoring\n"
        "- **Statistics** — batting/bowling leaderboards\n"
        "- **Groups & Points** — group stage & points table\n"
        "- **Group Reveal** — spinner reveal ceremony\n"
        "- **News / Media / Banners** — content management\n"
        "- **Admin** — user management & dashboard\n"
        "- **Notifications** — user notifications\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "filter": True,
        "tryItOutEnabled": True,
    },
    openapi_tags=[
        {"name": "Health",         "description": "Health check endpoints"},
        {"name": "Auth",           "description": "Login, token refresh, logout, current user"},
        {"name": "Players",        "description": "BNI registered player management"},
        {"name": "Teams",          "description": "Cricket team management"},
        {"name": "Matches",        "description": "Match scheduling and results (BNI)"},
        {"name": "Live Scores",    "description": "BNI live score widget"},
        {"name": "Tournaments",    "description": "CricPro tournament engine"},
        {"name": "Matches",        "description": "CricPro match management & scoring setup"},
        {"name": "Scoring",        "description": "Ball-by-ball live scoring engine"},
        {"name": "Statistics",     "description": "Batting & bowling leaderboards"},
        {"name": "Groups",         "description": "Group stage management"},
        {"name": "Points Table",   "description": "Points table management"},
        {"name": "Group Reveal",   "description": "Spinner reveal ceremony"},
        {"name": "News",           "description": "News & match stories"},
        {"name": "Media",          "description": "Media file uploads"},
        {"name": "Banners",        "description": "Homepage banner management"},
        {"name": "Schedule",       "description": "Match schedule snapshots"},
        {"name": "Admin",          "description": "Admin dashboard & user management"},
        {"name": "Notifications",  "description": "User notifications"},
    ],
)

# ── Custom OpenAPI — inject Bearer auth scheme ─────────────────────────────
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Paste your JWT access token (from POST /api/v1/auth/login)",
    }
    # Apply BearerAuth globally as optional (endpoints that need it will enforce it)
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation.setdefault("security", [{"BearerAuth": []}, {}])
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi  # type: ignore[method-assign]

# ── CORS (must be outermost middleware — added last) ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.add_middleware(BaseHTTPMiddleware, dispatch=log_requests)

# ── Static files (CricPro media uploads) ──────────────────────────────────
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

# ── Exception handlers ─────────────────────────────────────────────────────
@app.exception_handler(ValidationError)
async def pydantic_validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Validation error.", "data": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error.", "data": None},
    )


# ── Health check ───────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": "2.0.0", "env": settings.APP_ENV}

@app.get("/api/health", tags=["Health"])
async def api_health():
    return {"status": "ok", "app": settings.APP_NAME, "version": "2.0.0"}


# ── Register all routers ───────────────────────────────────────────────────
API = "/api/v1"

# BNI core routes
app.include_router(auth_router,          prefix=API)
app.include_router(players_router,       prefix=API)
app.include_router(news_router,          prefix=API)
app.include_router(live_scores_router,   prefix=API)
app.include_router(media_router,         prefix=API)
app.include_router(teams_router,         prefix=API)
app.include_router(matches_router,       prefix=API)
app.include_router(groups_router,        prefix=API)
app.include_router(points_router,        prefix=API)
app.include_router(banners_router,       prefix=API)
app.include_router(schedule_router,      prefix=API)
app.include_router(group_reveal_router,  prefix=API)
app.include_router(admin_users_router,   prefix=API)

# CricPro scoring routes
app.include_router(scoring_router,          prefix=API)
app.include_router(scoring_matches_router,  prefix=API)
app.include_router(cricpro_players_router,  prefix=API)
app.include_router(tournaments_router,      prefix=API)
app.include_router(player_profiles_router,  prefix=API)
app.include_router(stats_router,            prefix=API)
app.include_router(stats_admin_router,      prefix=API)
app.include_router(admin_extra_router,      prefix=API)
app.include_router(notifications_router,    prefix=API)

app.include_router(tournament_stages_router, prefix=API)
# WebSocket (no prefix — uses /ws/match/{id})
app.include_router(ws_router)
