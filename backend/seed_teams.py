"""
Seed the 20 BNI teams into the database.
Run: python seed_teams.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Team

TEAMS = [
    {"name": "BNI Azpire",      "short": "AZP", "city": "Trichy"},
    {"name": "BNI Benchmark",   "short": "BMK", "city": "Trichy"},
    {"name": "BNI Champions",   "short": "CHP", "city": "Trichy"},
    {"name": "BNI Dynamic",     "short": "DYN", "city": "Trichy"},
    {"name": "BNI Emperor",     "short": "EMP", "city": "Trichy"},
    {"name": "BNI Fortune",     "short": "FOR", "city": "Trichy"},
    {"name": "BNI Gladiators",  "short": "GLD", "city": "Trichy"},
    {"name": "BNI Harmony",     "short": "HMY", "city": "Trichy"},
    {"name": "BNI Icons",       "short": "ICN", "city": "Trichy"},
    {"name": "BNI Jaaguar",     "short": "JAG", "city": "Trichy"},
    {"name": "BNI Kings",       "short": "KNG", "city": "Trichy"},
    {"name": "BNI Legends",     "short": "LGD", "city": "Trichy"},
    {"name": "BNI Millionaire", "short": "MLN", "city": "Trichy"},
    {"name": "BNI Nest",        "short": "NST", "city": "Trichy"},
    {"name": "BNI Prince",      "short": "PRC", "city": "Trichy"},
    {"name": "BNI Spark",       "short": "SPK", "city": "Trichy"},
    {"name": "BNI Royals",      "short": "ROY", "city": "Trichy"},
    {"name": "BNI Warriors",    "short": "WAR", "city": "Trichy"},
    {"name": "BNI Oscar",       "short": "OSC", "city": "Trichy"},
    {"name": "BNI Tycoon",      "short": "TYC", "city": "Trichy"},
]

async def seed():
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(Team))).scalars().all()
        existing_names = {t.name for t in existing}
        existing_shorts = {t.short for t in existing}

        added = 0
        for t in TEAMS:
            if t["name"] in existing_names:
                print(f"  SKIP (exists): {t['name']}")
                continue
            # Ensure short is unique
            short = t["short"]
            if short in existing_shorts:
                short = short[:3] + "X"
            team = Team(
                name=t["name"],
                short=short,
                city=t["city"],
                is_active=True,
            )
            db.add(team)
            existing_shorts.add(short)
            added += 1
            print(f"  ADD: {t['name']} ({short})")

        await db.commit()
        print(f"\n✅ Done — {added} teams added, {len(existing_names)} already existed.")

if __name__ == "__main__":
    asyncio.run(seed())
