"""
Seed BNI Royals players into the database.

Each player gets:
  - A User account  (username derived from phone, role=player)
  - A PlayerProfile linked to BNI Royals team

Run from the backend directory:
    python seed_royals.py
"""
import asyncio
import re
import sys
import os

# Make sure app imports work
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select, text
from app.database.session import AsyncSessionLocal
from app.models import User, UserRole, Team, PlayerProfile
from app.core.security import hash_password

SCHEMA = "bni"
TEAM_NAME = "BNI Royals"

# ── Player data from the registration table ──────────────────────────────────
# Fields: (full_name, phone, jersey_name, jersey_number, jersey_size, lower_size)
ROYALS_PLAYERS = [
    ("Ayyappan",                "+919787831717",  "Ayyappan",                             1,  "38", "38"),
    ("Sagubar Sathik",          "+919842539080",  "CELLLINE MOBILES & APPLIANCES",        7,  "40", "40"),
    ("Mohamed Mustaffa Nihal",  "+918940799216",  "Mustaffa",                             7,  "44", "44"),
    ("Shajahan N",              "+917502310222",  "Alif building materials Shajahan",     5,  "42", "38"),
    ("C Senthilkumar",          "+919443147544",  "Senthil Auditor",                     10,  "38", "38"),
    ("B Sankar",                "+919786604388",  "Sankar",                              21,  "38", "38"),
    ("Riaz",                    "+917094300184",  "Riaz",                                12,  "40", "40"),
    ("Arnav Banjwal",           "+919797807937",  "Arnav banjwal",                       23,  "38", "38"),
    ("Zubair Ali Jafrullah",    "+919962524252",  "ZUBAIR",                               5,  "40", "38"),
    ("Krithika Yogaraj",        "+917871781039",  "KIKI",                                13,  "38", "38"),
    ("Yuvarani",                "+919943267798",  "Yuvarani",                             1,  "40", "40"),
    ("Jayaraman",               "+919965298320",  "CLASSIC POLO",                         5,  "42", "38"),
    ("Saraswathy K",            "+919597666485",  "Sachu",                                5,  "38", "38"),
    ("Syedabdulfazith",         "+919787480500",  "Fazith",                               7,  "42", "42"),
    ("Sambantham",              "+919629312994",  "SAMBANTHAM",                           1,  "XL", "L"),
    ("Salai Mamani Sekaran",    "+919176833321",  "Salai Mamani",                         1,  "XL", "L"),
    ("Noor Mohamad",            "+919841529583",  "Noor",                               100,  "L",  "M"),
    ("Arunmani",                "+919786422411",  "ARUN",                                10,  "L",  "M"),
    ("John Prabhu",             "+918883181455",  "John Prabhu",                          4,  "XXL","XXL"),
    ("Yousuff Gani",            "+919688972461",  "YOUSUFF",                             10,  "XL", "XXL"),
]


def _username_from_phone(phone: str) -> str:
    """Create a clean username from phone number."""
    digits = re.sub(r"\D", "", phone)[-10:]  # last 10 digits
    return f"roy_{digits}"


def _email_from_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)[-10:]
    return f"roy_{digits}@bni.local"


async def seed_royals():
    async with AsyncSessionLocal() as db:
        # Find BNI Royals team
        result = await db.execute(
            select(Team).where(Team.name == TEAM_NAME)
        )
        team = result.scalar_one_or_none()
        if not team:
            print(f"❌ Team '{TEAM_NAME}' not found. Run the app once to seed teams first.")
            return

        print(f"✅ Found team: {team.name} (id={team.id})")

        created_users = 0
        created_profiles = 0
        skipped = 0

        for full_name, phone, jersey_name, jersey_number, jersey_size, lower_size in ROYALS_PLAYERS:
            username = _username_from_phone(phone)
            email = _email_from_phone(phone)

            # Check if user already exists
            existing_user = (await db.execute(
                select(User).where(User.username == username)
            )).scalar_one_or_none()

            if existing_user:
                user = existing_user
                print(f"  ↩  User exists: {username}")
            else:
                user = User(
                    username=username,
                    email=email,
                    hashed_password=hash_password("BniRoyals@2026"),
                    full_name=full_name,
                    phone=phone,
                    role=UserRole.player,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                await db.flush()  # get user.id
                created_users += 1
                print(f"  ✅ Created user: {username} ({full_name})")

            # Check if PlayerProfile already exists for this user+team
            existing_profile = (await db.execute(
                select(PlayerProfile).where(
                    PlayerProfile.user_id == user.id,
                    PlayerProfile.team_id == team.id,
                )
            )).scalar_one_or_none()

            if existing_profile:
                print(f"     ↩  Profile exists for {username} in {TEAM_NAME}")
                skipped += 1
                continue

            profile = PlayerProfile(
                user_id=user.id,
                team_id=team.id,
                jersey_number=int(jersey_number) if str(jersey_number).isdigit() else None,
                player_role="Player",
                is_active=True,
                is_captain=False,
                is_wicket_keeper=False,
            )
            db.add(profile)
            created_profiles += 1
            print(f"     ✅ Created profile: #{jersey_number} {full_name}")

        await db.commit()
        print(f"\n🏏 Done! Created {created_users} users, {created_profiles} profiles, {skipped} skipped (already exist).")


if __name__ == "__main__":
    asyncio.run(seed_royals())
