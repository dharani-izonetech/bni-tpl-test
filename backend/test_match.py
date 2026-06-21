import asyncio, sys, os, uuid
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models import Match, Team
from app.routes.scoring_matches import _get_match_with_teams, _match_to_dict
from app.core.security import hash_password

async def test():
    async with AsyncSessionLocal() as db:
        # Get two teams
        result = await db.execute(select(Team).limit(2))
        teams = result.scalars().all()
        t1, t2 = teams[0], teams[1]
        print(f"Teams: {t1.name} vs {t2.name}")

        # Create match directly
        m = Match(
            team1_id=t1.id, team2_id=t2.id,
            overs=10, match_type="league",
        )
        db.add(m)
        await db.commit()
        await db.refresh(m)
        print(f"Match inserted: id={m.id}")

        # Now try _get_match_with_teams
        try:
            fetched = await _get_match_with_teams(m.id, db)
            print(f"Fetched: {fetched}")
            d = _match_to_dict(fetched)
            print(f"Dict: id={d['id']}, status={d['status']}")
            print("✅ Works!")
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test())
