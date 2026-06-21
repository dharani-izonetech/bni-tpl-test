"""Add Super12, Knockout stages, scheduling, and audit tables

Revision ID: 0006
Revises: 0005_news_match_story_image
Create Date: 2026-06-09
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0006'
down_revision = '0005_news_match_story_image'
branch_labels = None
depends_on = None

SCHEMA = "bni"

# Declare enum types once, with create_type=False so SQLAlchemy never
# auto-issues CREATE TYPE DDL — we manage that ourselves via DO blocks.
matchtype   = postgresql.ENUM('day', 'floodlight',
                               name='matchtype', schema=SCHEMA, create_type=False)
stagetype   = postgresql.ENUM('league', 'super12', 'quarterfinal', 'semifinal', 'final',
                               name='stagetype', schema=SCHEMA, create_type=False)
schedstatus = postgresql.ENUM('scheduled', 'rescheduled', 'postponed', 'completed', 'cancelled',
                               name='schedstatus', schema=SCHEMA, create_type=False)


def upgrade() -> None:
    # ── Enums (idempotent) ─────────────────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type t
                           JOIN pg_namespace n ON n.oid = t.typnamespace
                           WHERE t.typname = 'matchtype' AND n.nspname = 'bni') THEN
                CREATE TYPE bni.matchtype AS ENUM ('day', 'floodlight');
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type t
                           JOIN pg_namespace n ON n.oid = t.typnamespace
                           WHERE t.typname = 'stagetype' AND n.nspname = 'bni') THEN
                CREATE TYPE bni.stagetype AS ENUM ('league','super12','quarterfinal','semifinal','final');
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type t
                           JOIN pg_namespace n ON n.oid = t.typnamespace
                           WHERE t.typname = 'schedstatus' AND n.nspname = 'bni') THEN
                CREATE TYPE bni.schedstatus AS ENUM ('scheduled','rescheduled','postponed','completed','cancelled');
            END IF;
        END $$;
    """)

    # ── super12_groups ─────────────────────────────────────────────────────────
    op.create_table(
        'super12_groups',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(10), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── super12_group_teams ────────────────────────────────────────────────────
    op.create_table(
        'super12_group_teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('group_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.super12_groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('slot_label', sa.String(32)),
        sa.Column('is_wildcard', sa.Boolean, default=False),
        sa.UniqueConstraint('group_id', 'team_id', name='uq_s12_group_team'),
        schema=SCHEMA,
    )

    # ── super12_points ─────────────────────────────────────────────────────────
    op.create_table(
        'super12_points',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('group_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.super12_groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('played', sa.Integer, default=0),
        sa.Column('won', sa.Integer, default=0),
        sa.Column('lost', sa.Integer, default=0),
        sa.Column('points', sa.Integer, default=0),
        sa.Column('runs_for', sa.Integer, default=0),
        sa.Column('runs_against', sa.Integer, default=0),
        sa.Column('nrr', sa.Float, default=0.0),
        sa.Column('overs_faced', sa.Float, default=0.0),
        sa.Column('overs_bowled', sa.Float, default=0.0),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('group_id', 'team_id', name='uq_s12_points'),
        schema=SCHEMA,
    )

    # ── super12_matches ────────────────────────────────────────────────────────
    op.create_table(
        'super12_matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('group_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.super12_groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team1_score', sa.Integer),
        sa.Column('team2_score', sa.Integer),
        sa.Column('team1_wickets', sa.Integer),
        sa.Column('team2_wickets', sa.Integer),
        sa.Column('team1_overs', sa.Float),
        sa.Column('team2_overs', sa.Float),
        sa.Column('toss_winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('batting_first_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('status', sa.String(20), default='upcoming'),
        sa.Column('match_date', sa.Date),
        sa.Column('start_time', sa.Time),
        sa.Column('end_time', sa.Time),
        sa.Column('match_type', matchtype),
        sa.Column('ground', sa.String(128)),
        sa.Column('overs', sa.Integer, default=6),
        sa.Column('schedule_status', schedstatus),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── quarterfinal_matches ───────────────────────────────────────────────────
    op.create_table(
        'quarterfinal_matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('match_number', sa.Integer, nullable=False),
        sa.Column('slot_label', sa.String(16)),
        sa.Column('team1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team1_score', sa.Integer),
        sa.Column('team2_score', sa.Integer),
        sa.Column('team1_wickets', sa.Integer),
        sa.Column('team2_wickets', sa.Integer),
        sa.Column('team1_overs', sa.Float),
        sa.Column('team2_overs', sa.Float),
        sa.Column('toss_winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('batting_first_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('status', sa.String(20), default='upcoming'),
        sa.Column('match_date', sa.Date),
        sa.Column('start_time', sa.Time),
        sa.Column('end_time', sa.Time),
        sa.Column('match_type', matchtype),
        sa.Column('ground', sa.String(128)),
        sa.Column('overs', sa.Integer, default=8),
        sa.Column('schedule_status', schedstatus),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── semifinal_matches ──────────────────────────────────────────────────────
    op.create_table(
        'semifinal_matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('match_number', sa.Integer, nullable=False),
        sa.Column('qf1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.quarterfinal_matches.id', ondelete='SET NULL')),
        sa.Column('qf2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.quarterfinal_matches.id', ondelete='SET NULL')),
        sa.Column('team1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team1_score', sa.Integer),
        sa.Column('team2_score', sa.Integer),
        sa.Column('team1_wickets', sa.Integer),
        sa.Column('team2_wickets', sa.Integer),
        sa.Column('team1_overs', sa.Float),
        sa.Column('team2_overs', sa.Float),
        sa.Column('toss_winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('batting_first_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('status', sa.String(20), default='upcoming'),
        sa.Column('match_date', sa.Date),
        sa.Column('start_time', sa.Time),
        sa.Column('end_time', sa.Time),
        sa.Column('match_type', matchtype),
        sa.Column('ground', sa.String(128)),
        sa.Column('overs', sa.Integer, default=8),
        sa.Column('schedule_status', schedstatus),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── final_match ────────────────────────────────────────────────────────────
    op.create_table(
        'final_match',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sf1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.semifinal_matches.id', ondelete='SET NULL')),
        sa.Column('sf2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.semifinal_matches.id', ondelete='SET NULL')),
        sa.Column('team1_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team2_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('team1_score', sa.Integer),
        sa.Column('team2_score', sa.Integer),
        sa.Column('team1_wickets', sa.Integer),
        sa.Column('team2_wickets', sa.Integer),
        sa.Column('team1_overs', sa.Float),
        sa.Column('team2_overs', sa.Float),
        sa.Column('toss_winner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('batting_first_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('status', sa.String(20), default='upcoming'),
        sa.Column('match_date', sa.Date),
        sa.Column('start_time', sa.Time),
        sa.Column('end_time', sa.Time),
        sa.Column('match_type', matchtype),
        sa.Column('ground', sa.String(128)),
        sa.Column('overs', sa.Integer, default=8),
        sa.Column('schedule_status', schedstatus),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── tournament_champion ────────────────────────────────────────────────────
    op.create_table(
        'tournament_champion',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('champion_team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('runner_up_team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.teams.id', ondelete='SET NULL')),
        sa.Column('tournament_year', sa.Integer),
        sa.Column('summary', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── team_override_logs ─────────────────────────────────────────────────────
    op.create_table(
        'team_override_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('stage', stagetype, nullable=False),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('previous_value', sa.Text),
        sa.Column('new_value', sa.Text),
        sa.Column('admin_user', sa.String(128)),
        sa.Column('reason', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )

    # ── match_schedule_logs ────────────────────────────────────────────────────
    op.create_table(
        'match_schedule_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('stage', stagetype, nullable=False),
        sa.Column('match_id', sa.String(64), nullable=False),
        sa.Column('field_changed', sa.String(64)),
        sa.Column('previous_value', sa.Text),
        sa.Column('new_value', sa.Text),
        sa.Column('admin_user', sa.String(128)),
        sa.Column('reason', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema=SCHEMA,
    )


def downgrade() -> None:
    for tbl in ['match_schedule_logs', 'team_override_logs', 'tournament_champion',
                'final_match', 'semifinal_matches', 'quarterfinal_matches',
                'super12_matches', 'super12_points', 'super12_group_teams', 'super12_groups']:
        op.drop_table(tbl, schema=SCHEMA)
    op.execute("DROP TYPE IF EXISTS bni.schedstatus")
    op.execute("DROP TYPE IF EXISTS bni.stagetype")
    op.execute("DROP TYPE IF EXISTS bni.matchtype")
