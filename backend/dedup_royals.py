r"""
Remove duplicate BNI Royals players from registered_players and player_profiles.
Keeps the OLDEST row per name (first registered), deletes the rest.
Run: C:\Users\Vigneshwar\AppData\Local\Programs\Python\Python312\python.exe dedup_royals.py
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

    # ── 1. registered_players dedup ──────────────────────────────────────────
    print("=== registered_players ===")
    rows = await conn.fetch(
        f"""
        SELECT id, name, registered_at
        FROM {SCHEMA}.registered_players
        WHERE team_name = 'BNI Royals'
        ORDER BY name, registered_at ASC
        """
    )
    print(f"Total Royals rows: {len(rows)}")

    # Group by normalised name, keep oldest
    seen: dict[str, str] = {}   # name -> keep_id
    delete_ids = []
    for r in rows:
        key = r["name"].strip().lower()
        if key not in seen:
            seen[key] = str(r["id"])
        else:
            delete_ids.append(str(r["id"]))

    if delete_ids:
        await conn.execute(
            f"DELETE FROM {SCHEMA}.registered_players WHERE id = ANY($1::uuid[])",
            delete_ids
        )
        print(f"Deleted {len(delete_ids)} duplicate(s): {[r['name'] for r in rows if str(r['id']) in delete_ids]}")
    else:
        print("No duplicates found.")

    # ── 2. player_profiles dedup ──────────────────────────────────────────────
    print("\n=== player_profiles ===")
    # Find the BNI Royals team UUID
    team = await conn.fetchrow(
        f"SELECT id FROM {SCHEMA}.teams WHERE name = 'BNI Royals'"
    )
    if not team:
        print("Team not found — skipping player_profiles dedup.")
    else:
        team_id = team["id"]
        pp_rows = await conn.fetch(
            f"""
            SELECT pp.id, u.full_name, u.username, pp.joined_at
            FROM {SCHEMA}.player_profiles pp
            JOIN {SCHEMA}.users u ON u.id = pp.user_id
            WHERE pp.team_id = $1
            ORDER BY u.username, pp.joined_at ASC
            """,
            team_id
        )
        print(f"Total Royals profiles: {len(pp_rows)}")

        seen_pp: dict[str, int] = {}   # username -> keep_id
        del_pp = []
        for r in pp_rows:
            key = (r["username"] or "").lower()
            if key not in seen_pp:
                seen_pp[key] = r["id"]
            else:
                del_pp.append(r["id"])

        if del_pp:
            await conn.execute(
                f"DELETE FROM {SCHEMA}.player_profiles WHERE id = ANY($1::int[])",
                del_pp
            )
            print(f"Deleted {len(del_pp)} duplicate profile(s).")
        else:
            print("No duplicates found.")

    # ── 3. Final counts ────────────────────────────────────────────────────────
    rp_count = await conn.fetchval(
        f"SELECT count(*) FROM {SCHEMA}.registered_players WHERE team_name='BNI Royals'"
    )
    pp_count = await conn.fetchval(
        f"SELECT count(*) FROM {SCHEMA}.player_profiles WHERE team_id=$1", team_id
    ) if team else "N/A"
    print(f"\n✅ Final: {rp_count} registered_players | {pp_count} player_profiles for BNI Royals")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
