"""Leaderboard and statistics routes — delegated to stats_admin module."""
from fastapi import APIRouter
router = APIRouter(prefix="/stats", tags=["Statistics"])
# All stat endpoints are in stats_admin.py (stats_router, admin_router, notifications_router)
