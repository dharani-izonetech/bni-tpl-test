"""add match_story_image_url to news_items

Revision ID: 0005_news_match_story_image
Revises: 0004_cricpro_scoring
Create Date: 2026-06-08 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0005_news_match_story_image"
down_revision: Union[str, None] = "0004_cricpro_scoring"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "news_items",
        sa.Column("match_story_image_url", sa.Text(), nullable=True),
        schema="bni",
    )


def downgrade() -> None:
    op.drop_column("news_items", "match_story_image_url", schema="bni")
