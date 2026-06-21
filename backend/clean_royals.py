r"""
Clean BNI Royals registered_players — remove near-duplicate names, keep canonical.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe clean_royals.py
"""
import asyncio

DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA = "bni"

# Names to DELETE (duplicates/variants), keeping the canonical version
DELETE_NAMES = [
    "Noor Mohamad",          # keep "Noor Mohamed"
    "Shajahan. N",           # keep "Shajahan N"
    "SYEDABDULFAZITH",       # keep "Syedabdulfazith"
    "YOUSUFF GANI",          # keep "Yousuff Gani"  (case dup from registered form)
    "Mohamed Mustaffa nihal",# keep "Mohamed Mustaffa Nihal" (proper caps)
    "Arnav banjwal",         # keep "Arnav Banjwal"
]

async def main():
    try:
        import asyncpg
    except ImportError:
        import os, sys; os.system(f"{sys.executable} -m pip install asyncpg -q"); import asyncpg

    conn = await asyncpg.connect(DB_DSN)

    # Show current state
    rows = await conn.fetch(
        f"SELECT id, name FROM {SCHEMA}.registered_players "
        f"WHERE team_name='BNI Royals' ORDER BY name"
    )
    print(f"Before: {len(rows)} rows")
    for r in rows:
        print(f"  {r['name']}")

    # Delete the exact duplicate names
    deleted = 0
    for name in DELETE_NAMES:
        r = await conn.execute(
            f"DELETE FROM {SCHEMA}.registered_players "
            f"WHERE team_name='BNI Royals' AND name=$1",
            name
        )
        count = int(r.split()[-1])
        if count:
            print(f"\n  🗑  Deleted: '{name}' ({count} row)")
            deleted += count
        else:
            print(f"\n  ↩  Not found: '{name}'")

    # Final count
    remaining = await conn.fetchval(
        f"SELECT count(*) FROM {SCHEMA}.registered_players WHERE team_name='BNI Royals'"
    )
    print(f"\n✅ After cleanup: {remaining} players ({deleted} removed)")

    # Show final list
    final = await conn.fetch(
        f"SELECT name, role FROM {SCHEMA}.registered_players "
        f"WHERE team_name='BNI Royals' ORDER BY "
        f"CASE WHEN role='Captain' THEN 0 ELSE 1 END, name"
    )
    print("\nFinal squad:")
    for i, r in enumerate(final, 1):
        print(f"  {i:2}. {r['name']} ({r['role']})")

    await conn.close()

asyncio.run(main())
