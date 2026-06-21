"""scoring_enhancements

Revision ID: 0007_scoring_enhancements
Revises: 0006_tournament_stages
Create Date: 2026-06-20 00:00:00.000000

- Add is_vice_captain to player_profiles and playing_xi
- Add fielder2_id to balls (relay throw / second fielder in run-out)
- Add wicket_keeper_id to balls (stumping/caught behind)
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0007_scoring_enhancements"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMA = "bni"


def upgrade() -> None:
    # ── player_profiles: add is_vice_captain ─────────────────────────────
    op.add_column(
        "player_profiles",
        sa.Column("is_vice_captain", sa.Boolean(), nullable=False, server_default="false"),
        schema=SCHEMA,
    )

    # ── playing_xi: add is_vice_captain ───────────────────────────────────
    op.add_column(
        "playing_xi",
        sa.Column("is_vice_captain", sa.Boolean(), nullable=False, server_default="false"),
        schema=SCHEMA,
    )

    # ── balls: add fielder2_id (relay throw) and wicket_keeper_id ─────────
    op.add_column(
        "balls",
        sa.Column("fielder2_id", sa.Integer(), nullable=True),
        schema=SCHEMA,
    )
    op.add_column(
        "balls",
        sa.Column("wicket_keeper_id", sa.Integer(), nullable=True),
        schema=SCHEMA,
    )
    op.create_foreign_key(
        "fk_balls_fielder2", "balls", "player_profiles",
        ["fielder2_id"], ["id"],
        source_schema=SCHEMA, referent_schema=SCHEMA,
    )
    op.create_foreign_key(
        "fk_balls_keeper", "balls", "player_profiles",
        ["wicket_keeper_id"], ["id"],
        source_schema=SCHEMA, referent_schema=SCHEMA,
    )


def downgrade() -> None:
    op.drop_constraint("fk_balls_keeper", "balls", schema=SCHEMA, type_="foreignkey")
    op.drop_constraint("fk_balls_fielder2", "balls", schema=SCHEMA, type_="foreignkey")
    op.drop_column("balls", "wicket_keeper_id", schema=SCHEMA)
    op.drop_column("balls", "fielder2_id", schema=SCHEMA)
    op.drop_column("playing_xi", "is_vice_captain", schema=SCHEMA)
    op.drop_column("player_profiles", "is_vice_captain", schema=SCHEMA)
