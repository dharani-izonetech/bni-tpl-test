"""CricPro compatibility adapter — bridges to unified auth dependencies."""
from app.auth.dependencies import (
    get_current_user, require_admin, require_organizer,
    require_scorer, get_optional_user,
)
__all__ = ["get_current_user", "require_admin", "require_organizer", "require_scorer", "get_optional_user"]
