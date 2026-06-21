"""
Pure, dependency-free cricket scoring rules.

This module deliberately imports nothing from FastAPI, SQLAlchemy, Redis or the
DB session so the core rules can be unit-tested in isolation (see
`backend/tests/test_scoring_rules.py`). The async endpoint in
`app/routes/scoring.py` delegates to these helpers so the live behaviour and the
tested behaviour stay in sync.

Ball-type / dismissal-type values are passed as plain strings to keep this layer
decoupled from the ORM enums. The string values match the `BallType` /
`DismissalType` enum `.value`s used everywhere else.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

# Ball-type string constants (mirror app.models.models.BallType values)
NORMAL = "normal"
WIDE = "wide"
NO_BALL = "no_ball"
BYE = "bye"
LEG_BYE = "leg_bye"
PENALTY = "penalty"

# Legal deliveries advance the over and (for the striker) count as a ball faced.
_LEGAL_BALL_TYPES = frozenset({NORMAL, BYE, LEG_BYE})

# Deliveries on which the striker is regarded as having faced the ball.
# Note: byes are NOT a ball faced *credited to the striker's balls* here because
# the project's existing rule credits balls_faced on normal, no_ball and leg_bye
# only (a bye is a missed/keeper extra, leg_bye still came off the pad while the
# batter was on strike). This preserves the pre-existing behaviour exactly.
_BALL_FACED_TYPES = frozenset({NORMAL, NO_BALL, LEG_BYE})


def calculate_overs(legal_balls: int) -> float:
    """Convert a count of legal balls into cricket "overs.balls" float form.

    6 legal balls == 1.0 over; 7 == 1.1; 13 == 2.1, etc.
    """
    return legal_balls // 6 + (legal_balls % 6) / 10


def is_legal_ball(ball_type: str) -> bool:
    """True for deliveries that advance the over counter (normal/bye/leg_bye)."""
    return ball_type in _LEGAL_BALL_TYPES


def counts_as_ball_faced(ball_type: str) -> bool:
    """True if the striker's balls-faced should increment for this delivery."""
    return ball_type in _BALL_FACED_TYPES


@dataclass(frozen=True)
class RunsBreakdown:
    batter_runs: int
    extra_runs: int
    total_runs: int
    is_boundary: bool
    is_six: bool


def compute_runs_breakdown(ball_type: str, runs_off_bat: int, extra_runs: int) -> RunsBreakdown:
    """Split a delivery into runs credited to the batter vs. team extras.

    Rules (Feature 3 — Leg Bye scoring):
      * Wide     → 0 to batter, all to extras (frontend sends 1 + byes).
      * No Ball  → runs_off_bat to batter, extras carries the no-ball penalty.
      * Bye      → 0 to batter, all to extras.
      * Leg Bye  → 0 to batter, all to extras (e.g. 2 leg byes => extras += 2,
                   striker runs += 0).
      * Normal   → runs_off_bat to batter, 0 extras.

    Boundary/six flags are only set for genuine bat boundaries on a normal ball.
    """
    if ball_type == WIDE:
        batter_runs = 0
        extra_total = extra_runs
    elif ball_type == NO_BALL:
        batter_runs = runs_off_bat
        extra_total = extra_runs
    elif ball_type in (BYE, LEG_BYE):
        batter_runs = 0
        extra_total = extra_runs
    else:  # normal / penalty
        batter_runs = runs_off_bat
        extra_total = 0

    is_boundary = runs_off_bat == 4 and ball_type == NORMAL
    is_six = runs_off_bat == 6 and ball_type == NORMAL
    return RunsBreakdown(
        batter_runs=batter_runs,
        extra_runs=extra_total,
        total_runs=batter_runs + extra_total,
        is_boundary=is_boundary,
        is_six=is_six,
    )


def resolve_dismissed_player(
    *,
    is_wicket: bool,
    dismissed_is_non_striker: bool,
    non_striker_id: Optional[int],
    dismissed_player_id: Optional[int],
    batsman_id: int,
) -> Optional[int]:
    """Resolve which player id is actually out (Feature 1 — non-striker wickets).

    Priority:
      1. If a non-striker dismissal is flagged and we know the non-striker id,
         the non-striker is out.
      2. Otherwise use the explicit dismissed_player_id if supplied.
      3. Otherwise default to the striker (batsman_id).
    Returns None when it is not a wicket.
    """
    if not is_wicket:
        return None
    if dismissed_is_non_striker and non_striker_id:
        return non_striker_id
    return dismissed_player_id or batsman_id


def bowler_credited_with_wicket(is_wicket: bool, ball_type: str, dismissal_type: Optional[str]) -> bool:
    """True when the wicket should be added to the bowler's tally.

    Run-outs, retired-hurt and obstructing-the-field are never credited to the
    bowler, and no wicket can fall off a wide or no-ball.
    """
    if not is_wicket:
        return False
    if ball_type in (WIDE, NO_BALL):
        return False
    if dismissal_type in ("run_out", "retired_hurt", "obstructing_field"):
        return False
    return True


def counts_against_wickets(is_wicket: bool, ball_type: str, dismissal_type: Optional[str]) -> bool:
    """True when the team's wicket count should increment.

    Retired-hurt does not cost a wicket, and a dismissal off a no-ball (only a
    run-out is possible there) does not advance the wicket column under this
    project's existing rule.
    """
    if not is_wicket:
        return False
    if dismissal_type == "retired_hurt":
        return False
    if ball_type == NO_BALL:
        return False
    return True


def strike_rate(runs: int, balls_faced: int) -> float:
    """Batting strike rate = runs / balls * 100, rounded to 2dp (0 if no balls)."""
    if balls_faced <= 0:
        return 0.0
    return round((runs / balls_faced) * 100, 2)


def captain_tag(is_captain: bool, is_vice_captain: bool) -> str:
    """Return the " (C)" / " (VC)" suffix used in commentary and scorecards."""
    if is_captain:
        return " (C)"
    if is_vice_captain:
        return " (VC)"
    return ""


def build_commentary(
    *,
    is_wicket: bool,
    ball_type: str,
    dismissal_type: Optional[str],
    runs_off_bat: int,
    extra_runs: int,
    batter_name: str,
    bowler_name: str,
    fielder_name: Optional[str] = None,
    fielder2_name: Optional[str] = None,
    keeper_name: Optional[str] = None,
    is_captain: bool = False,
    is_vice_captain: bool = False,
    is_non_striker: bool = False,
) -> str:
    """Generate ball-by-ball commentary.

    Implements Feature 6 (captain/vice-captain markers) and Feature 7 (detailed
    wicket attribution — bowler, fielder(s), keeper) plus Feature 1 (non-striker
    dismissals e.g. "Run Out - Non-Striker (John Doe)").
    """
    tag = captain_tag(is_captain, is_vice_captain)
    b_tag = f"{batter_name}{tag}"

    if not is_wicket:
        if ball_type == WIDE:
            return f"Wide +{extra_runs} run{'s' if extra_runs != 1 else ''}"
        if ball_type == NO_BALL:
            extra = f", {runs_off_bat} off bat" if runs_off_bat else ""
            return f"No Ball{extra}"
        if ball_type == BYE:
            return f"Bye — {extra_runs} run{'s' if extra_runs != 1 else ''}"
        if ball_type == LEG_BYE:
            return f"Leg Bye — {extra_runs} run{'s' if extra_runs != 1 else ''}"
        r = runs_off_bat
        if r == 4:
            return f"FOUR! {b_tag} drives beautifully"
        if r == 6:
            return f"SIX! {b_tag} launches it over the boundary"
        if r == 0:
            return f"Dot ball — {bowler_name} keeps it tight"
        return f"{b_tag} picks up {r} run{'s' if r != 1 else ''}"

    # Wicket commentary
    dismissed = f"{'Non-striker ' if is_non_striker else ''}{b_tag}"
    pretty = (dismissal_type or "out").replace("_", " ").title()

    if dismissal_type == "bowled":
        return f"WICKET! {dismissed} b {bowler_name} — Bowled!"
    if dismissal_type == "lbw":
        return f"WICKET! {dismissed} lbw b {bowler_name}"
    if dismissal_type == "caught":
        if keeper_name:
            return f"WICKET! {dismissed} c †{keeper_name} b {bowler_name} — Caught behind!"
        if fielder_name:
            return f"WICKET! {dismissed} c {fielder_name} b {bowler_name}"
        return f"WICKET! {dismissed} caught b {bowler_name}"
    if dismissal_type == "stumped":
        k = keeper_name or "Keeper"
        return f"WICKET! {dismissed} st †{k} b {bowler_name} — Stumped!"
    if dismissal_type == "run_out":
        if fielder_name and fielder2_name:
            return f"WICKET! {dismissed} run out ({fielder_name}/{fielder2_name})"
        if fielder_name:
            return f"WICKET! {dismissed} run out ({fielder_name})"
        return f"WICKET! {dismissed} run out"
    if dismissal_type == "hit_wicket":
        return f"WICKET! {dismissed} hit wicket b {bowler_name}"
    if dismissal_type == "obstructing_field":
        return f"WICKET! {dismissed} obstructing the field"
    if dismissal_type == "retired_hurt":
        return f"{dismissed} retired hurt"
    return f"WICKET! {dismissed} — {pretty}"


# ── Over bounce rule (Feature 2) ───────────────────────────────────────────

@dataclass(frozen=True)
class BounceOutcome:
    converted_to_no_ball: bool
    extra_runs: int
    warning: Optional[str]


def apply_bounce_rule(prior_bounces_in_over: int, current_extra_runs: int) -> BounceOutcome:
    """Apply the per-over bounce rule.

    * 1st bounce in the over  → legal delivery, warning only.
    * 2nd (or later) bounce    → converted to a NO BALL, +1 extra run added if no
                                 extras were supplied, and the ball does not count
                                 as a legal delivery.
    `prior_bounces_in_over` is the number of bounce deliveries already recorded in
    the current over *before* this one.
    """
    if prior_bounces_in_over >= 1:
        extra = current_extra_runs if current_extra_runs > 0 else 1
        return BounceOutcome(
            converted_to_no_ball=True,
            extra_runs=extra,
            warning="Second bounce in over - No Ball.",
        )
    return BounceOutcome(
        converted_to_no_ball=False,
        extra_runs=current_extra_runs,
        warning="Warning: First bounce recorded in this over.",
    )
