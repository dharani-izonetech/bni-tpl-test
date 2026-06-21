r"""
Re-add the two players that were accidentally deleted during dedup.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe add_missing_royals.py
"""
import asyncio, uuid
from datetime import datetime, timezone

DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA = "bni"

MISSING = [
    ("Syedabdulfazith", "Player"),
    ("Yousuff Gani",    "Player"),
]

async def main():
    import asyncpg
    conn = await asyncpg.connect(DB_DSN)
    now = datetime.now(timezone.utc)

    for name, role in MISSING:
        exists = await conn.fetchval(
            f"SELECT id FROM {SCHEMA}.registered_players "
            f"WHERE team_name='BNI Royals' AND lower(name)=lower($1)",
            name
        )
        if exists:
            print(f"  ↩  Exists: {name}")
        else:
            await conn.execute(
                f"""INSERT INTO {SCHEMA}.registered_players
                    (id, name, business, category, phone_no,
                     team_name, team_short, role,
                     jersey_number, jersey_size, track_pant_size,
                     registered_at, updated_at)
                VALUES ($1,$2,$3,'Cricket',$4,
                        'BNI Royals','ROY',$5,
                        '','M','M',$6,$6)""",
                uuid.uuid4(), name, name,
                f"ROY{uuid.uuid4().hex[:9]}",
                role, now
            )
            print(f"  ✅ Inserted: {name}")

    count = await conn.fetchval(
        f"SELECT count(*) FROM {SCHEMA}.registered_players WHERE team_name='BNI Royals'"
    )
    # Show final clean list
    rows = await conn.fetch(
        f"""SELECT name, role FROM {SCHEMA}.registered_players
            WHERE team_name='BNI Royals'
            ORDER BY CASE WHEN role='Captain' THEN 0 ELSE 1 END, name"""
    )
    print(f"\n✅ Final squad ({count} players):")
    for i, r in enumerate(rows, 1):
        print(f"  {i:2}. {r['name']} ({r['role']})")

    await conn.close()

asyncio.run(main())
