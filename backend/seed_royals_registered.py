r"""
Seed BNI Royals players into bni.registered_players (public squad table).
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe seed_royals_registered.py
"""
import asyncio, uuid
from datetime import datetime, timezone

DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA = "bni"

ROYALS = [
    # (name,                    business,                    role,      jersey_no, is_captain)
    ("Mohamed Mustaffa Nihal",  "Mohamed Mustaffa Nihal",   "Captain",  "7",      True),
    ("Ayyappan",                "Ayyappan",                 "Player",   "1",      False),
    ("Arunmani",                "Arunmani",                 "Player",   "10",     False),
    ("Noor Mohamed",            "Noor Mohamed",             "Player",   "100",    False),
    ("Sagubar Sathick",         "CELLLINE MOBILES",         "Player",   "7",      False),
    ("Syedabdulfazith",         "Fazith",                   "Player",   "7",      False),
    ("Salai Mamani Sekaran",    "Salai Mamani",             "Player",   "1",      False),
    ("Jayaraman",               "CLASSIC POLO",             "Player",   "5",      False),
    ("Sambantham",              "Sambantham",               "Player",   "1",      False),
    ("Yousuff Gani",            "Yousuff",                  "Player",   "10",     False),
    ("Zubair Ali Jafrullah",    "ZUBAIR",                   "Player",   "5",      False),
    ("John Prabhu",             "John Prabhu",              "Player",   "4",      False),
    ("C Senthilkumar",          "Senthil Auditor",          "Player",   "10",     False),
    ("Riaz",                    "Riaz",                     "Player",   "12",     False),
    ("Arnav Banjwal",           "Arnav Banjwal",            "Player",   "23",     False),
    ("B Sankar",                "Sankar",                   "Player",   "21",     False),
    ("Shajahan N",              "Alif Building Materials",  "Player",   "5",      False),
    ("Krithika Yogaraj",        "KIKI",                     "Player",   "13",     False),
    ("Yuvarani",                "Yuvarani",                 "Player",   "1",      False),
    ("Saraswathy K",            "Sachu",                    "Player",   "5",      False),
]


async def main():
    try:
        import asyncpg
    except ImportError:
        import os, sys
        os.system(f"{sys.executable} -m pip install asyncpg -q")
        import asyncpg

    conn = await asyncpg.connect(DB_DSN)
    now = datetime.now(timezone.utc)
    inserted = skipped = 0

    try:
        for name, business, role, jersey, is_captain in ROYALS:
            # Skip if already exists by name + team
            existing = await conn.fetchrow(
                f"SELECT id FROM {SCHEMA}.registered_players WHERE name=$1 AND team_name=$2",
                name, "BNI Royals"
            )
            if existing:
                print(f"  ↩  Exists: {name}")
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
                        'BNI Royals','ROY',$5,
                        $6,'M','M',
                        $7,$7)
                """,
                uuid.uuid4(), name, business,
                f"ROY{uuid.uuid4().hex[:8]}",   # unique placeholder phone
                role, jersey, now
            )
            print(f"  ✅ Inserted: {name} ({role}, #{jersey})")
            inserted += 1

        print(f"\n🏏 Done! {inserted} inserted, {skipped} skipped.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
