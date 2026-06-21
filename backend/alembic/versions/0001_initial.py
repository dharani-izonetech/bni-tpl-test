"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "user", name="userrole"), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    # refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )

    # registered_players
    op.create_table(
        "registered_players",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("business", sa.String(256), nullable=False),
        sa.Column("category", sa.String(128), nullable=False),
        sa.Column("phone_no", sa.String(13), nullable=False),
        sa.Column("team_name", sa.String(64), nullable=False),
        sa.Column("team_short", sa.String(8)),
        sa.Column("role", sa.String(32), nullable=False, server_default="Player"),
        sa.Column("membership_years", sa.Integer()),
        sa.Column("jersey_number", sa.String(4)),
        sa.Column("jersey_size", sa.String(4)),
        sa.Column("track_pant_size", sa.String(4)),
        sa.Column("photo_url", sa.Text()),
        sa.Column("photo_key", sa.Text()),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone_no", name="uq_player_phone"),
    )
    op.create_index("ix_registered_players_name", "registered_players", ["name"])
    op.create_index("ix_registered_players_team_name", "registered_players", ["team_name"])

    # teams
    op.create_table(
        "teams",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("short", sa.String(8), nullable=False),
        sa.Column("logo_url", sa.Text()),
        sa.Column("logo_key", sa.Text()),
        sa.Column("captain", sa.String(128)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("short"),
    )

    # media_files
    op.create_table(
        "media_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(256), nullable=False),
        sa.Column("original_filename", sa.String(256), nullable=False),
        sa.Column("media_type", sa.Enum("video_file", "video_link", "image", name="mediatype"), nullable=False),
        sa.Column("bucket", sa.String(64), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("public_url", sa.Text()),
        sa.Column("embed_url", sa.Text()),
        sa.Column("size_bytes", sa.Integer()),
        sa.Column("mime_type", sa.String(64)),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # matches
    op.create_table(
        "matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("team1_id", postgresql.UUID(as_uuid=True)),
        sa.Column("team2_id", postgresql.UUID(as_uuid=True)),
        sa.Column("status", sa.Enum("LIVE", "COMPLETED", "UPCOMING", name="matchstatus"), nullable=False, server_default="UPCOMING"),
        sa.Column("match_date", sa.DateTime(timezone=True)),
        sa.Column("venue", sa.String(256)),
        sa.Column("result", sa.Text()),
        sa.Column("is_revealed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["team1_id"], ["teams.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["team2_id"], ["teams.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slot"),
    )

    # live_scores
    op.create_table(
        "live_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("match_id", postgresql.UUID(as_uuid=True)),
        sa.Column("team1_name", sa.String(64), nullable=False),
        sa.Column("team1_short", sa.String(8), nullable=False),
        sa.Column("team1_score", sa.String(16)),
        sa.Column("team1_overs", sa.String(8)),
        sa.Column("team2_name", sa.String(64), nullable=False),
        sa.Column("team2_short", sa.String(8), nullable=False),
        sa.Column("team2_score", sa.String(16)),
        sa.Column("team2_overs", sa.String(8)),
        sa.Column("status", sa.Enum("LIVE", "COMPLETED", "UPCOMING", name="matchstatus"), nullable=False),
        sa.Column("venue", sa.String(256)),
        sa.Column("result", sa.Text()),
        sa.Column("video_id", postgresql.UUID(as_uuid=True)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["video_id"], ["media_files.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # news_items
    op.create_table(
        "news_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("news_title_en", sa.String(256), nullable=False),
        sa.Column("news_title_ta", sa.String(256)),
        sa.Column("news_description_en", sa.Text()),
        sa.Column("news_description_ta", sa.Text()),
        sa.Column("venue_en", sa.String(256)),
        sa.Column("venue_ta", sa.String(256)),
        sa.Column("match_time_en", sa.String(128)),
        sa.Column("match_time_ta", sa.String(128)),
        sa.Column("status_en", sa.String(128)),
        sa.Column("status_ta", sa.String(128)),
        sa.Column("audience", sa.Integer(), server_default="0"),
        sa.Column("media_embed_url", sa.Text()),
        sa.Column("match_story_title_en", sa.String(256)),
        sa.Column("match_story_title_ta", sa.String(256)),
        sa.Column("match_story_description_en", sa.Text()),
        sa.Column("match_story_description_ta", sa.Text()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="true"),
        sa.PrimaryKeyConstraint("id"),
    )

    # groups
    op.create_table(
        "groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )

    # group_teams
    op.create_table(
        "group_teams",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "team_id", name="uq_group_team"),
    )

    # points_table
    op.create_table(
        "points_table",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True)),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("played", sa.Integer(), server_default="0"),
        sa.Column("won", sa.Integer(), server_default="0"),
        sa.Column("lost", sa.Integer(), server_default="0"),
        sa.Column("nrr", sa.Float(), server_default="0"),
        sa.Column("points", sa.Integer(), server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "team_id", name="uq_points_group_team"),
    )

    # banners
    op.create_table(
        "banners",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(256)),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("image_key", sa.Text()),
        sa.Column("link_url", sa.Text()),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # match_schedule_snapshots
    op.create_table(
        "match_schedule_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slot_to_team_name", sa.Text()),
        sa.Column("schedule_plan", sa.Text()),
        sa.Column("revealed_count", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    for tbl in [
        "match_schedule_snapshots", "banners", "points_table", "group_teams",
        "groups", "news_items", "live_scores", "matches", "media_files",
        "teams", "registered_players", "refresh_tokens", "users",
    ]:
        op.drop_table(tbl)

    for enum in ["userrole", "matchstatus", "mediatype"]:
        op.execute(f"DROP TYPE IF EXISTS {enum}")
