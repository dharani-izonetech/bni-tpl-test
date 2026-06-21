"""
Seed the database: admin user + 20 BNI teams.
Called from startup lifespan event.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import User, UserRole, Team
from app.core.security import hash_password
from app.core.config import settings

logger = logging.getLogger(__name__)

BNI_TEAMS = [
    ("BNI Azpire",      "AZP"),
    ("BNI Benchmark",   "BMK"),
    ("BNI Champions",   "CHP"),
    ("BNI Dynamic",     "DYN"),
    ("BNI Emperor",     "EMP"),
    ("BNI Fortune",     "FOR"),
    ("BNI Gladiators",  "GLD"),
    ("BNI Harmony",     "HMY"),
    ("BNI Icons",       "ICN"),
    ("BNI Jaaguar",     "JAG"),
    ("BNI Kings",       "KNG"),
    ("BNI Legends",     "LGD"),
    ("BNI Millionaire", "MLN"),
    ("BNI Nest",        "NST"),
    ("BNI Prince",      "PRC"),
    ("BNI Spark",       "SPK"),
    ("BNI Royals",      "ROY"),
    ("BNI Warriors",    "WAR"),
    ("BNI Oscar",       "OSC"),
    ("BNI Tycoon",      "TYC"),
]


async def seed_admin(db: AsyncSession) -> None:
    """Create admin user if missing."""
    result = await db.execute(select(User).where(User.username == settings.ADMIN_USERNAME))
    admin = result.scalar_one_or_none()
    if not admin:
        admin = User(
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(admin)
        await db.commit()
        logger.info("Admin user seeded: %s", settings.ADMIN_USERNAME)
    else:
        logger.info("Admin user already exists: %s", admin.username)


async def seed_teams(db: AsyncSession) -> None:
    """Seed the 20 BNI teams if they don't exist yet."""
    existing = (await db.execute(select(Team))).scalars().all()
    existing_names = {t.name for t in existing}
    existing_shorts = {t.short for t in existing}

    added = 0
    for name, short in BNI_TEAMS:
        if name in existing_names:
            continue
        # Ensure short code is unique
        s = short if short not in existing_shorts else short[:2] + "X"
        db.add(Team(name=name, short=s, city="Trichy", is_active=True))
        existing_shorts.add(s)
        added += 1

    if added:
        await db.commit()
        logger.info("Seeded %d BNI teams.", added)
    else:
        logger.info("All BNI teams already exist.")
