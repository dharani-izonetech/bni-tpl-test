r"""
Dedup player_profiles for BNI Royals — keep lowest id per user_id.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe dedup_profiles.py
"""
import asyncio

DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA = "bni"

async def main():
    try:
        import asyncpg
    except ImportError:
        import os, sys; os.system(f"{sys.executable} -m pip install asyncpg -q"); import asyncpg

    conn = await asyncpg.connect(DB_DSN)

    team = await conn.fetchrow(f"SELECT id FROM {SCHEMA}.teams WHERE name='BNI Royals'")
    if not team:
        print("Team not found"); await conn.close(); return

    team_id = team["id"]

    # Delete all but the lowest id per user_id in this team
    result = await conn.execute(
        f"""
        DELETE FROM {SCHEMA}.player_profiles
        WHERE team_id = $1
          AND id NOT IN (
            SELECT MIN(id)
            FROM {SCHEMA}.player_profiles
            WHERE team_id = $1
            GROUP BY user_id
          )
        """,
        team_id
    )
    print(f"Deleted: {result}")

    count = await conn.fetchval(
        f"SELECT count(*) FROM {SCHEMA}.player_profiles WHERE team_id=$1", team_id
    )
    print(f"✅ BNI Royals player_profiles remaining: {count}")
    await conn.close()

asyncio.run(main())
