"""add_cricpro_scoring_tables

Revision ID: 0004_cricpro_scoring
Revises: 0003_group_reveal_snapshots
Create Date: 2026-05-31 00:00:00.000000

Adds CricPro scoring engine tables to the BNI schema:
- Extends users with CricPro profile fields
- Extends teams with city/description/owner_id/is_active
- Adds player_profiles (future player import target)
- Adds player_career_stats
- Adds tournaments + tournament_teams
- Extends matches with full scoring fields
- Adds playing_xi, innings, balls, batting_scores, bowling_figures
- Adds fall_of_wickets, partnerships
- Extends points_table with tournament_id + NRR detail columns
- Adds notifications
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0004_cricpro_scoring"
down_revision: Union[str, None] = "0003_group_reveal_snapshots"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMA = "bni"
# Tables created by 0001_initial live in the public schema (no schema= was used).
# Enums (userrole, matchstatus) were also created in public by 0001_initial.
PUBLIC = "public"


def upgrade() -> None:
    # ── Extend users ─────────────────────────────────────────────────────
    op.add_column("users", sa.Column("full_name", sa.String(128), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"), schema=SCHEMA)
    op.add_column("users", sa.Column("profile_photo", sa.String(500), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("batting_style", sa.String(50), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("bowling_style", sa.String(50), nullable=True), schema=SCHEMA)
    op.add_column("users", sa.Column("date_of_birth", sa.DateTime(timezone=True), nullable=True), schema=SCHEMA)

    # Add new user role values — enums live in public schema (created by 0001_initial)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'organizer';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.userrole ADD VALUE IF NOT EXISTS 'organizer';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'player';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.userrole ADD VALUE IF NOT EXISTS 'player';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'scorer';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.userrole ADD VALUE IF NOT EXISTS 'scorer';
        END $$;
    """)

    # ── Extend teams ──────────────────────────────────────────────────────
    op.add_column("teams", sa.Column("city", sa.String(100), nullable=True), schema=SCHEMA)
    op.add_column("teams", sa.Column("description", sa.Text(), nullable=True), schema=SCHEMA)
    op.add_column("teams", sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True), schema=SCHEMA)
    op.add_column("teams", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"), schema=SCHEMA)
    op.add_column("teams", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True), schema=SCHEMA)
    op.create_foreign_key("fk_teams_owner", "teams", "users", ["owner_id"], ["id"], ondelete="SET NULL", source_schema=SCHEMA, referent_schema=SCHEMA)

    # ── Extend matches ────────────────────────────────────────────────────
    op.add_column("matches", sa.Column("tournament_id", sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("match_number", sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("match_type", sa.String(50), nullable=False, server_default="league"), schema=SCHEMA)
    op.add_column("matches", sa.Column("overs", sa.Integer(), nullable=False, server_default="20"), schema=SCHEMA)
    op.add_column("matches", sa.Column("toss_winner_id", postgresql.UUID(as_uuid=True), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("toss_decision", sa.String(10), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("winner_id", postgresql.UUID(as_uuid=True), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("win_margin", sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("win_by", sa.String(20), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("result_summary", sa.String(500), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("current_innings", sa.Integer(), nullable=False, server_default="1"), schema=SCHEMA)
    op.add_column("matches", sa.Column("player_of_match_id", sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("notes", sa.Text(), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True), schema=SCHEMA)
    op.add_column("matches", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True), schema=SCHEMA)

    # Add new match status values — enum lives in public schema (created by 0001_initial)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.matchstatus ADD VALUE IF NOT EXISTS 'scheduled';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.matchstatus ADD VALUE IF NOT EXISTS 'scheduled';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.matchstatus ADD VALUE IF NOT EXISTS 'toss';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.matchstatus ADD VALUE IF NOT EXISTS 'toss';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.matchstatus ADD VALUE IF NOT EXISTS 'innings_break';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.matchstatus ADD VALUE IF NOT EXISTS 'innings_break';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.matchstatus ADD VALUE IF NOT EXISTS 'abandoned';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.matchstatus ADD VALUE IF NOT EXISTS 'abandoned';
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE public.matchstatus ADD VALUE IF NOT EXISTS 'cancelled';
        EXCEPTION WHEN undefined_object THEN
            ALTER TYPE bni.matchstatus ADD VALUE IF NOT EXISTS 'cancelled';
        END $$;
    """)

    # ── Extend points_table ───────────────────────────────────────────────
    op.add_column("points_table", sa.Column("tournament_id", sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column("points_table", sa.Column("tied", sa.Integer(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("no_result", sa.Integer(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("runs_scored", sa.Integer(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("overs_faced", sa.Float(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("runs_conceded", sa.Integer(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("overs_bowled", sa.Float(), nullable=False, server_default="0"), schema=SCHEMA)
    op.add_column("points_table", sa.Column("group_name", sa.String(10), nullable=True), schema=SCHEMA)

    # ── Tournament enums ──────────────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE bni.tournamentformat AS ENUM ('league','knockout','league_knockout','round_robin');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE bni.tournamentstatus AS ENUM ('upcoming','ongoing','completed','cancelled');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE bni.balltype AS ENUM ('normal','wide','no_ball','bye','leg_bye','penalty');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE bni.dismissaltype AS ENUM ('bowled','caught','lbw','run_out','stumped',
                'hit_wicket','handled_ball','obstructing_field','timed_out','retired_hurt');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE bni.tossdecision AS ENUM ('bat','bowl');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # ── Tournaments ───────────────────────────────────────────────────────
    op.create_table(
        "tournaments",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("banner", sa.String(500), nullable=True),
        sa.Column("format", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="upcoming"),
        sa.Column("organizer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("venue", sa.String(200), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("overs_per_innings", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("max_teams", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("entry_fee", sa.Float(), nullable=True),
        sa.Column("prize_money", sa.Float(), nullable=True),
        sa.Column("rules", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["organizer_id"], [f"{SCHEMA}.users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )
    op.create_index("ix_tournaments_id", "tournaments", ["id"], schema=SCHEMA)

    op.create_table(
        "tournament_teams",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_name", sa.String(10), nullable=True),
        sa.Column("seed", sa.Integer(), nullable=True),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tournament_id"], [f"{SCHEMA}.tournaments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], [f"{SCHEMA}.teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tournament_id", "team_id", name="uq_tournament_team"),
        schema=SCHEMA,
    )

    # Add FK from matches (bni) to tournaments (bni)
    op.create_foreign_key("fk_matches_tournament", "matches", "tournaments", ["tournament_id"], ["id"], ondelete="CASCADE", source_schema=SCHEMA, referent_schema=SCHEMA)

    # Add FK from points_table (bni) to tournaments (bni)
    op.create_foreign_key("fk_points_tournament", "points_table", "tournaments", ["tournament_id"], ["id"], ondelete="CASCADE", source_schema=SCHEMA, referent_schema=SCHEMA)

    # ── Player Profiles ───────────────────────────────────────────────────
    op.create_table(
        "player_profiles",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("photo_path", sa.String(500), nullable=True),
        sa.Column("batting_style", sa.String(50), nullable=True),
        sa.Column("bowling_style", sa.String(50), nullable=True),
        sa.Column("player_role", sa.String(50), nullable=True),
        sa.Column("jersey_number", sa.Integer(), nullable=True),
        sa.Column("batting_order", sa.Integer(), nullable=True),
        sa.Column("is_captain", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_wicket_keeper", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], [f"{SCHEMA}.users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], [f"{SCHEMA}.teams.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "team_id", name="uq_player_team"),
        schema=SCHEMA,
    )
    op.create_index("ix_player_profiles_id", "player_profiles", ["id"], schema=SCHEMA)
    op.create_index("idx_player_team", "player_profiles", ["team_id", "is_active"], schema=SCHEMA)

    # Add FK from matches (bni) to player_profiles (bni) for player_of_match
    op.create_foreign_key("fk_matches_pom", "matches", "player_profiles", ["player_of_match_id"], ["id"], ondelete="SET NULL", source_schema=SCHEMA, referent_schema=SCHEMA)

    # ── Playing XI ────────────────────────────────────────────────────────
    op.create_table(
        "playing_xi",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("batting_order", sa.Integer(), nullable=True),
        sa.Column("is_captain", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_wicket_keeper", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["match_id"], [f"{SCHEMA}.matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], [f"{SCHEMA}.teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player_id"], [f"{SCHEMA}.player_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("match_id", "team_id", "player_id", name="uq_playing_xi"),
        schema=SCHEMA,
    )

    # ── Innings ───────────────────────────────────────────────────────────
    op.create_table(
        "innings",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("innings_number", sa.Integer(), nullable=False),
        sa.Column("batting_team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("bowling_team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("total_runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_wickets", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_overs", sa.Float(), nullable=False, server_default="0"),
        sa.Column("extras_wide", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extras_no_ball", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extras_bye", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extras_leg_bye", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extras_penalty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("target", sa.Integer(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("declared", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["match_id"], [f"{SCHEMA}.matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["batting_team_id"], [f"{SCHEMA}.teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bowling_team_id"], [f"{SCHEMA}.teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("match_id", "innings_number", name="uq_match_innings"),
        schema=SCHEMA,
    )
    op.create_index("ix_innings_id", "innings", ["id"], schema=SCHEMA)

    # ── Balls ─────────────────────────────────────────────────────────────
    op.create_table(
        "balls",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("innings_id", sa.Integer(), nullable=False),
        sa.Column("over_number", sa.Integer(), nullable=False),
        sa.Column("ball_number", sa.Integer(), nullable=False),
        sa.Column("batsman_id", sa.Integer(), nullable=False),
        sa.Column("bowler_id", sa.Integer(), nullable=False),
        sa.Column("non_striker_id", sa.Integer(), nullable=True),
        sa.Column("runs_off_bat", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extra_runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ball_type", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("is_wicket", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("dismissal_type", sa.String(30), nullable=True),
        sa.Column("dismissed_player_id", sa.Integer(), nullable=True),
        sa.Column("fielder_id", sa.Integer(), nullable=True),
        sa.Column("is_free_hit", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_boundary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_six", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("commentary", sa.Text(), nullable=True),
        sa.Column("total_runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("innings_runs_after", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("innings_wickets_after", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["innings_id"], [f"{SCHEMA}.innings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["batsman_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["bowler_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["non_striker_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["dismissed_player_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["fielder_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )
    op.create_index("ix_balls_id", "balls", ["id"], schema=SCHEMA)
    op.create_index("idx_ball_innings_over", "balls", ["innings_id", "over_number", "ball_number"], schema=SCHEMA)

    # ── Batting Scores ────────────────────────────────────────────────────
    op.create_table(
        "batting_scores",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("innings_id", sa.Integer(), nullable=False),
        sa.Column("batsman_id", sa.Integer(), nullable=False),
        sa.Column("runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("balls_faced", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fours", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sixes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_out", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("dismissal_type", sa.String(30), nullable=True),
        sa.Column("bowler_id", sa.Integer(), nullable=True),
        sa.Column("fielder_id", sa.Integer(), nullable=True),
        sa.Column("batting_position", sa.Integer(), nullable=True),
        sa.Column("came_in_at_over", sa.Float(), nullable=True),
        sa.Column("out_at_over", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["innings_id"], [f"{SCHEMA}.innings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["batsman_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["bowler_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["fielder_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("innings_id", "batsman_id", name="uq_innings_batsman"),
        schema=SCHEMA,
    )

    # ── Bowling Figures ───────────────────────────────────────────────────
    op.create_table(
        "bowling_figures",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("innings_id", sa.Integer(), nullable=False),
        sa.Column("bowler_id", sa.Integer(), nullable=False),
        sa.Column("overs", sa.Float(), nullable=False, server_default="0"),
        sa.Column("maidens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wickets", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wides", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("no_balls", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("economy_rate", sa.Float(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["innings_id"], [f"{SCHEMA}.innings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bowler_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("innings_id", "bowler_id", name="uq_innings_bowler"),
        schema=SCHEMA,
    )

    # ── Fall of Wickets ───────────────────────────────────────────────────
    op.create_table(
        "fall_of_wickets",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("innings_id", sa.Integer(), nullable=False),
        sa.Column("wicket_number", sa.Integer(), nullable=False),
        sa.Column("runs_at_fall", sa.Integer(), nullable=False),
        sa.Column("overs_at_fall", sa.Float(), nullable=False),
        sa.Column("batsman_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["innings_id"], [f"{SCHEMA}.innings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["batsman_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )

    # ── Partnerships ──────────────────────────────────────────────────────
    op.create_table(
        "partnerships",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("innings_id", sa.Integer(), nullable=False),
        sa.Column("batsman1_id", sa.Integer(), nullable=False),
        sa.Column("batsman2_id", sa.Integer(), nullable=False),
        sa.Column("runs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("balls", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wicket_number", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["innings_id"], [f"{SCHEMA}.innings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["batsman1_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.ForeignKeyConstraint(["batsman2_id"], [f"{SCHEMA}.player_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )

    # ── Player Career Stats ───────────────────────────────────────────────
    op.create_table(
        "player_career_stats",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("matches_played", sa.Integer(), server_default="0"),
        sa.Column("innings_batted", sa.Integer(), server_default="0"),
        sa.Column("runs_scored", sa.Integer(), server_default="0"),
        sa.Column("balls_faced", sa.Integer(), server_default="0"),
        sa.Column("highest_score", sa.Integer(), server_default="0"),
        sa.Column("fours", sa.Integer(), server_default="0"),
        sa.Column("sixes", sa.Integer(), server_default="0"),
        sa.Column("fifties", sa.Integer(), server_default="0"),
        sa.Column("hundreds", sa.Integer(), server_default="0"),
        sa.Column("not_outs", sa.Integer(), server_default="0"),
        sa.Column("batting_average", sa.Float(), server_default="0"),
        sa.Column("strike_rate", sa.Float(), server_default="0"),
        sa.Column("innings_bowled", sa.Integer(), server_default="0"),
        sa.Column("overs_bowled", sa.Float(), server_default="0"),
        sa.Column("runs_conceded", sa.Integer(), server_default="0"),
        sa.Column("wickets", sa.Integer(), server_default="0"),
        sa.Column("best_bowling_runs", sa.Integer(), server_default="0"),
        sa.Column("best_bowling_wickets", sa.Integer(), server_default="0"),
        sa.Column("economy_rate", sa.Float(), server_default="0"),
        sa.Column("bowling_average", sa.Float(), server_default="0"),
        sa.Column("bowling_strike_rate", sa.Float(), server_default="0"),
        sa.Column("five_wicket_hauls", sa.Integer(), server_default="0"),
        sa.Column("catches", sa.Integer(), server_default="0"),
        sa.Column("run_outs", sa.Integer(), server_default="0"),
        sa.Column("stumpings", sa.Integer(), server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["player_id"], [f"{SCHEMA}.player_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("player_id"),
        schema=SCHEMA,
    )

    # ── Notifications ─────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("reference_id", sa.Integer(), nullable=True),
        sa.Column("reference_type", sa.String(50), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], [f"{SCHEMA}.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema=SCHEMA,
    )
    op.create_index("ix_notifications_id", "notifications", ["id"], schema=SCHEMA)


def downgrade() -> None:
    op.drop_table("notifications", schema=SCHEMA)
    op.drop_table("player_career_stats", schema=SCHEMA)
    op.drop_table("partnerships", schema=SCHEMA)
    op.drop_table("fall_of_wickets", schema=SCHEMA)
    op.drop_table("bowling_figures", schema=SCHEMA)
    op.drop_table("batting_scores", schema=SCHEMA)
    op.drop_table("balls", schema=SCHEMA)
    op.drop_table("innings", schema=SCHEMA)
    op.drop_table("playing_xi", schema=SCHEMA)
    op.drop_table("player_profiles", schema=SCHEMA)
    op.drop_table("tournament_teams", schema=SCHEMA)
    op.drop_table("tournaments", schema=SCHEMA)
    # Revert column additions on bni-schema tables
    op.drop_column("points_table", "group_name", schema=SCHEMA)
    op.drop_column("points_table", "overs_bowled", schema=SCHEMA)
    op.drop_column("points_table", "runs_conceded", schema=SCHEMA)
    op.drop_column("points_table", "overs_faced", schema=SCHEMA)
    op.drop_column("points_table", "runs_scored", schema=SCHEMA)
    op.drop_column("points_table", "no_result", schema=SCHEMA)
    op.drop_column("points_table", "tied", schema=SCHEMA)
    op.drop_column("points_table", "tournament_id", schema=SCHEMA)
