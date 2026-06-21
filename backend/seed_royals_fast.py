r"""
Fast seed: BNI Royals players via raw asyncpg SQL.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe seed_royals_fast.py
"""
import asyncio, re, os, sys, uuid
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
DB_DSN = "postgresql://data_admin:qqssxx%26234%23Tc@72.62.198.6:5432/izone_db"
SCHEMA = "bni"
TEAM_NAME = "BNI Royals"
# Pre-hashed "BniRoyals@2026" with bcrypt rounds=12 — avoids hashing 20x
HASHED_PW = "$2b$12$08Sf4q5mCP.cJ/2fKckVRuH67ZABNOE0WedPc0GNQ.24pBW1f7ND2"

ROYALS_PLAYERS = [
    ("Ayyappan",               "+919787831717",   1),
    ("Sagubar Sathik",         "+919842539080",   7),
    ("Mohamed Mustaffa Nihal", "+918940799216",   7),
    ("Shajahan N",             "+917502310222",   5),
    ("C Senthilkumar",         "+919443147544",  10),
    ("B Sankar",               "+919786604388",  21),
    ("Riaz",                   "+917094300184",  12),
    ("Arnav Banjwal",          "+919797807937",  23),
    ("Zubair Ali Jafrullah",   "+919962524252",   5),
    ("Krithika Yogaraj",       "+917871781039",  13),
    ("Yuvarani",               "+919943267798",   1),
    ("Jayaraman",              "+919965298320",   5),
    ("Saraswathy K",           "+919597666485",   5),
    ("Syedabdulfazith",        "+919787480500",   7),
    ("Sambantham",             "+919629312994",   1),
    ("Salai Mamani Sekaran",   "+919176833321",   1),
    ("Noor Mohamad",           "+919841529583", 100),
    ("Arunmani",               "+919786422411",  10),
    ("John Prabhu",            "+918883181455",   4),
    ("Yousuff Gani",           "+919688972461",  10),
]


def phone_to_username(phone: str) -> str:
    return "roy_" + re.sub(r"\D", "", phone)[-10:]


async def main():
    try:
        import asyncpg
    except ImportError:
        print("Installing asyncpg...")
        os.system(f"{sys.executable} -m pip install asyncpg -q")
        import asyncpg

    conn = await asyncpg.connect(DB_DSN)
    now = datetime.now(timezone.utc)

    try:
        # 1. Find team
        team_row = await conn.fetchrow(
            f"SELECT id FROM {SCHEMA}.teams WHERE name = $1", TEAM_NAME
        )
        if not team_row:
            print(f"❌ Team '{TEAM_NAME}' not found. Run the app once to seed teams.")
            return
        team_id = team_row["id"]
        print(f"✅ Team: {TEAM_NAME} → {team_id}")

        created_users = created_profiles = skipped = 0

        for full_name, phone, jersey_number in ROYALS_PLAYERS:
            username = phone_to_username(phone)
            email = f"{username}@bni.local"

            # Upsert user (insert or skip if username exists)
            existing = await conn.fetchrow(
                f"SELECT id FROM {SCHEMA}.users WHERE username = $1", username
            )
            if existing:
                user_id = existing["id"]
                print(f"  ↩  User exists: {username}")
            else:
                user_id = uuid.uuid4()
                await conn.execute(
                    f"""
                    INSERT INTO {SCHEMA}.users
                        (id, username, email, hashed_password, role,
                         is_active, full_name, is_verified, phone,
                         created_at, updated_at)
                    VALUES ($1,$2,$3,$4,'player',true,$5,true,$6,$7,$7)
                    """,
                    user_id, username, email, HASHED_PW,
                    full_name, phone, now
                )
                created_users += 1
                print(f"  ✅ User: {username} ({full_name})")

            # Upsert player profile
            existing_profile = await conn.fetchrow(
                f"""SELECT id FROM {SCHEMA}.player_profiles
                    WHERE user_id=$1 AND team_id=$2""",
                user_id, team_id
            )
            if existing_profile:
                skipped += 1
                print(f"     ↩  Profile exists for {username}")
            else:
                await conn.execute(
                    f"""
                    INSERT INTO {SCHEMA}.player_profiles
                        (user_id, team_id, jersey_number, player_role,
                         is_active, is_captain, is_wicket_keeper, joined_at)
                    VALUES ($1,$2,$3,'Player',true,false,false,$4)
                    """,
                    user_id, team_id, jersey_number, now
                )
                created_profiles += 1
                print(f"     ✅ Profile: #{jersey_number} {full_name}")

        print(f"\n🏏 Done! {created_users} users, {created_profiles} profiles created, {skipped} skipped.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
