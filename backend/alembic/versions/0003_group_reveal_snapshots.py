"""add group_reveal_snapshots table

Revision ID: 0003_group_reveal_snapshots
Revises: 0002_player_photo_to_db
Create Date: 2026-05-30 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0003_group_reveal_snapshots"
down_revision: Union[str, None] = "0002_player_photo_to_db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "group_reveal_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_id", sa.String(4), nullable=False),
        sa.Column("selected_team_name", sa.String(128), nullable=False),
        sa.Column("matches", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_group_reveal_snapshots_group_id", "group_reveal_snapshots", ["group_id"])


def downgrade() -> None:
    op.drop_index("ix_group_reveal_snapshots_group_id", table_name="group_reveal_snapshots")
    op.drop_table("group_reveal_snapshots")
