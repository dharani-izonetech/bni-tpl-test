"""store player photo as base64 in db instead of minio

Revision ID: 0002_player_photo_to_db
Revises: 0001_initial
Create Date: 2026-05-23 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0002_player_photo_to_db"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMA = "bni"


def upgrade() -> None:
    # Add new column
    op.add_column(
        "registered_players",
        sa.Column("photo_data", sa.Text(), nullable=True),
        schema=SCHEMA,
    )
    # Drop old MinIO columns
    op.drop_column("registered_players", "photo_url", schema=SCHEMA)
    op.drop_column("registered_players", "photo_key", schema=SCHEMA)


def downgrade() -> None:
    op.add_column(
        "registered_players",
        sa.Column("photo_url", sa.Text(), nullable=True),
        schema=SCHEMA,
    )
    op.add_column(
        "registered_players",
        sa.Column("photo_key", sa.Text(), nullable=True),
        schema=SCHEMA,
    )
    op.drop_column("registered_players", "photo_data", schema=SCHEMA)
