import asyncio, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy import select, text
from app.database import AsyncSessionLocal
from app.models import PlayerProfile, User, Team

async def check():
    async with AsyncSessionLocal() as db:
        # Count all profiles
        result = await db.execute(select(PlayerProfile))
        profiles = result.scalars().all()
        print(f"Total player profiles: {len(profiles)}")
        for p in profiles[:5]:
            print(f"  id={p.id}, user_id={p.user_id}, team_id={p.team_id}, is_active={p.is_active}")

        # Count users with player role
        result2 = await db.execute(select(User).where(User.role == 'player'))
        players = result2.scalars().all()
        print(f"Total users with role=player: {len(players)}")
        for u in players[:3]:
            print(f"  {u.username} — {u.full_name}")

asyncio.run(check())
