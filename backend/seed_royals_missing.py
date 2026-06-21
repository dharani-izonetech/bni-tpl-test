r"""
Seed missing BNI Royals players into bni.registered_players.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe seed_royals_missing.py
"""
import asyncio, uuid
from datetime import datetime, timezone

DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA  = "bni"
TEAM    = "BNI Royals"
SHORT   = "ROY"

# Full intended squad (name, role)
ROYALS = [
    ("Mohamed Mustaffa Nihal", "Captain"),
    ("Ayyappan",               "Player"),
    ("Arunmani",               "Player"),
    ("Noor Mohamed",           "Player"),
    ("Sagubar Sathick",        "Player"),
    ("Syedabdulfazith",        "Player"),
    ("Salai Mamani Sekaran",   "Player"),
    ("Jayaraman",              "Player"),
    ("Sambantham",             "Player"),
    ("Yousuff Gani",           "Player"),
    ("Zubair Ali Jafrullah",   "Player"),
    ("John Prabhu",            "Player"),
    ("C Senthilkumar",         "Player"),
    ("Riaz",                   "Player"),
    ("Arnav Banjwal",          "Player"),   # Arshath listed — mapping to Arnav (same person)
    ("B Sankar",               "Player"),   # Shanker
    ("Shajahan N",             "Player"),
    ("Krithika Yogaraj",       "Player"),
    ("Yuvarani",               "Player"),
    ("Saraswathy K",           "Player"),
]


async def main():
    try:
        import asyncpg
    except ImportError:
        import os, sys
        os.system(f"{sys.executable} -m pip install asyncpg -q")
        import asyncpg

    conn = await asyncpg.connect(DB_DSN)
    now  = datetime.now(timezone.utc)
    inserted = skipped = 0

    try:
        # Fetch all existing names for this team
        rows = await conn.fetch(
            f"SELECT name FROM {SCHEMA}.registered_players WHERE team_name=$1", TEAM
        )
        existing_names = {r["name"].strip().lower() for r in rows}
        print(f"Existing players in {TEAM}: {len(existing_names)}")

        for name, role in ROYALS:
            if name.strip().lower() in existing_names:
                print(f"  ↩  Exists : {name}")
                skipped += 1
                continue

            await conn.execute(
                f"""
                INSERT INTO {SCHEMA}.registered_players
                    (id, name, business, category, phone_no,
                     team_name, team_short, role,
                     jersey_number, jersey_size, track_pant_size,
                     registered_at, updated_at)
                VALUES ($1,$2,$3,'Cricket',$4,
                        $5,$6,$7,
                        '','M','M',$8,$8)
                """,
                uuid.uuid4(),
                name,
                name,                          # business = name as placeholder
                f"ROY{uuid.uuid4().hex[:9]}",  # unique placeholder phone
                TEAM, SHORT, role, now,
            )
            print(f"  ✅ Inserted: {name} ({role})")
            inserted += 1

        # Ensure all existing Royals rows have the correct short code
        updated = await conn.execute(
            f"UPDATE {SCHEMA}.registered_players "
            f"SET team_short=$1 "
            f"WHERE team_name=$2 AND (team_short IS NULL OR team_short<>$1)",
            SHORT, TEAM
        )
        print(f"\n  🔧 Short-code fix: {updated}")
        print(f"\n🏏 Done! {inserted} inserted, {skipped} already existed.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
