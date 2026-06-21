"""CricPro compatibility adapter — bridges to unified database session."""
from app.database.session import Base, get_db, AsyncSessionLocal
__all__ = ["Base", "get_db", "AsyncSessionLocal"]
