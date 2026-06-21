"""
Unified router registry — exports all BNI route routers.
CricPro routers are registered separately in main.py.
"""
from app.routes.auth import router as auth_router
from app.routes.players import router as players_router
from app.routes.news import router as news_router
from app.routes.live_scores import router as live_scores_router
from app.routes.media import router as media_router
from app.routes.admin_users import router as admin_users_router
from app.routes.cricket import (
    teams_router,
    matches_router,
    groups_router,
    points_router,
    banners_router,
    schedule_router,
)

__all__ = [
    "auth_router",
    "players_router",
    "news_router",
    "live_scores_router",
    "media_router",
    "admin_users_router",
    "teams_router",
    "matches_router",
    "groups_router",
    "points_router",
    "banners_router",
    "schedule_router",
]
