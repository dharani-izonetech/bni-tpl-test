"""
Unit tests for the core scoring rules (Feature 10).

These tests exercise the pure rule layer in ``app.services.scoring_logic`` and
therefore run without a database, Redis or a live FastAPI app. They cover the
behaviour required by the enhancement spec:

  * Feature 1 — non-striker wicket resolution & run-out scenarios
  * Feature 2 — over bounce rule (1st bounce warning, 2nd bounce -> no ball)
  * Feature 3 — leg-bye scoring (1/2/3/4 leg byes; batter runs unaffected)
  * Feature 6 — captain / vice-captain highlighting in commentary
  * Feature 7 — detailed wicket attribution (bowler / keeper / fielder(s))
  * Feature 8 — dismissed-batsman strike-rate figure

Run with:   pytest backend/tests/test_scoring_rules.py -v
"""
import os
import sys

# Make `app` importable when pytest is invoked from the repo root or backend/.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import scoring_logic as sl  # noqa: E402


# ── Feature 3: Leg-bye scoring ─────────────────────────────────────────────

class TestLegByeScoring:
    def test_two_leg_byes(self):
        b = sl.compute_runs_breakdown(sl.LEG_BYE, runs_off_bat=0, extra_runs=2)
        assert b.batter_runs == 0           # striker runs += 0
        assert b.extra_runs == 2            # extras (leg bye) += 2
        assert b.total_runs == 2            # team score += 2
        assert b.is_boundary is False
        assert b.is_six is False

    def test_one_three_four_leg_byes(self):
        for n in (1, 3, 4):
            b = sl.compute_runs_breakdown(sl.LEG_BYE, runs_off_bat=0, extra_runs=n)
            assert b.batter_runs == 0
            assert b.extra_runs == n
            assert b.total_runs == n

    def test_leg_bye_counts_as_ball_faced_but_not_runs(self):
        # Leg bye is a legal delivery and the striker is credited a ball faced,
        # but no runs are added to the batter.
        assert sl.is_legal_ball(sl.LEG_BYE) is True
        assert sl.counts_as_ball_faced(sl.LEG_BYE) is True

    def test_bye_runs_go_to_extras_only(self):
        b = sl.compute_runs_breakdown(sl.BYE, runs_off_bat=0, extra_runs=3)
        assert b.batter_runs == 0
        assert b.extra_runs == 3
        # A bye is a legal delivery but is NOT credited as a ball faced here.
        assert sl.is_legal_ball(sl.BYE) is True
        assert sl.counts_as_ball_faced(sl.BYE) is False


# ── Normal / boundary / no-ball / wide run breakdowns ──────────────────────

class TestRunBreakdown:
    def test_normal_four_is_boundary(self):
        b = sl.compute_runs_breakdown(sl.NORMAL, runs_off_bat=4, extra_runs=0)
        assert b.batter_runs == 4 and b.total_runs == 4
        assert b.is_boundary is True and b.is_six is False

    def test_normal_six(self):
        b = sl.compute_runs_breakdown(sl.NORMAL, runs_off_bat=6, extra_runs=0)
        assert b.is_six is True and b.is_boundary is False

    def test_no_ball_credits_bat_runs_and_extra(self):
        # No ball with 2 run off the bat + 1 no-ball penalty.
        b = sl.compute_runs_breakdown(sl.NO_BALL, runs_off_bat=2, extra_runs=1)
        assert b.batter_runs == 2
        assert b.extra_runs == 1
        assert b.total_runs == 3
        # No ball is not a legal delivery.
        assert sl.is_legal_ball(sl.NO_BALL) is False

    def test_wide_all_to_extras(self):
        b = sl.compute_runs_breakdown(sl.WIDE, runs_off_bat=0, extra_runs=1)
        assert b.batter_runs == 0 and b.extra_runs == 1
        assert sl.is_legal_ball(sl.WIDE) is False


# ── Feature 2: Over bounce rule ────────────────────────────────────────────

class TestBounceRule:
    def test_first_bounce_is_warning_only(self):
        out = sl.apply_bounce_rule(prior_bounces_in_over=0, current_extra_runs=0)
        assert out.converted_to_no_ball is False
        assert out.extra_runs == 0
        assert out.warning == "Warning: First bounce recorded in this over."

    def test_second_bounce_becomes_no_ball_with_extra(self):
        out = sl.apply_bounce_rule(prior_bounces_in_over=1, current_extra_runs=0)
        assert out.converted_to_no_ball is True
        assert out.extra_runs == 1                       # auto +1 extra run
        assert out.warning == "Second bounce in over - No Ball."

    def test_second_bounce_preserves_existing_extras(self):
        out = sl.apply_bounce_rule(prior_bounces_in_over=2, current_extra_runs=3)
        assert out.converted_to_no_ball is True
        assert out.extra_runs == 3                       # do not clobber supplied extras


# ── Feature 1: Non-striker wicket + run-out resolution ─────────────────────

class TestDismissalResolution:
    def test_non_striker_dismissal_targets_non_striker(self):
        out = sl.resolve_dismissed_player(
            is_wicket=True, dismissed_is_non_striker=True,
            non_striker_id=22, dismissed_player_id=None, batsman_id=11,
        )
        assert out == 22

    def test_striker_dismissal_defaults_to_striker(self):
        out = sl.resolve_dismissed_player(
            is_wicket=True, dismissed_is_non_striker=False,
            non_striker_id=22, dismissed_player_id=None, batsman_id=11,
        )
        assert out == 11

    def test_explicit_dismissed_player_id_wins(self):
        out = sl.resolve_dismissed_player(
            is_wicket=True, dismissed_is_non_striker=False,
            non_striker_id=22, dismissed_player_id=33, batsman_id=11,
        )
        assert out == 33

    def test_not_a_wicket_returns_none(self):
        out = sl.resolve_dismissed_player(
            is_wicket=False, dismissed_is_non_striker=False,
            non_striker_id=22, dismissed_player_id=None, batsman_id=11,
        )
        assert out is None

    def test_run_out_not_credited_to_bowler(self):
        assert sl.bowler_credited_with_wicket(True, sl.NORMAL, "run_out") is False

    def test_bowled_credited_to_bowler(self):
        assert sl.bowler_credited_with_wicket(True, sl.NORMAL, "bowled") is True

    def test_no_wicket_off_no_ball(self):
        # Only a run-out is possible off a no-ball, and it never advances the
        # team wicket column under this project's rule.
        assert sl.counts_against_wickets(True, sl.NO_BALL, "run_out") is False

    def test_retired_hurt_does_not_cost_wicket(self):
        assert sl.counts_against_wickets(True, sl.NORMAL, "retired_hurt") is False

    def test_normal_caught_costs_wicket(self):
        assert sl.counts_against_wickets(True, sl.NORMAL, "caught") is True


# ── Feature 6 & 7: Commentary (captain markers + wicket attribution) ───────

class TestCommentary:
    def _wicket(self, **kw):
        base = dict(
            is_wicket=True, ball_type=sl.NORMAL, runs_off_bat=0, extra_runs=0,
            batter_name="John Doe", bowler_name="Smith",
        )
        base.update(kw)
        return sl.build_commentary(**base)

    def test_bowled_attribution(self):
        c = self._wicket(dismissal_type="bowled")
        assert "John Doe b Smith" in c

    def test_caught_with_fielder(self):
        c = self._wicket(dismissal_type="caught", fielder_name="David")
        assert "c David b Smith" in c

    def test_caught_behind_uses_keeper(self):
        c = self._wicket(dismissal_type="caught", keeper_name="Wilson")
        assert "Wilson" in c and "Caught behind" in c

    def test_stumped_uses_keeper(self):
        c = self._wicket(dismissal_type="stumped", keeper_name="Wilson")
        assert "st" in c and "Wilson" in c

    def test_run_out_single_fielder(self):
        c = self._wicket(dismissal_type="run_out", fielder_name="David")
        assert "run out (David)" in c

    def test_run_out_multiple_fielders(self):
        c = self._wicket(dismissal_type="run_out", fielder_name="David", fielder2_name="Wilson")
        assert "run out (David/Wilson)" in c

    def test_captain_marker_in_wicket(self):
        c = self._wicket(dismissal_type="bowled", is_captain=True)
        assert "(C)" in c

    def test_vice_captain_marker_in_wicket(self):
        c = self._wicket(dismissal_type="bowled", is_vice_captain=True)
        assert "(VC)" in c

    def test_non_striker_dismissal_labelled(self):
        c = self._wicket(dismissal_type="run_out", fielder_name="David", is_non_striker=True)
        assert "Non-striker" in c and "run out (David)" in c

    def test_boundary_commentary_for_four(self):
        c = sl.build_commentary(
            is_wicket=False, ball_type=sl.NORMAL, dismissal_type=None,
            runs_off_bat=4, extra_runs=0, batter_name="John Doe", bowler_name="Smith",
        )
        assert "FOUR" in c

    def test_leg_bye_commentary(self):
        c = sl.build_commentary(
            is_wicket=False, ball_type=sl.LEG_BYE, dismissal_type=None,
            runs_off_bat=0, extra_runs=2, batter_name="John Doe", bowler_name="Smith",
        )
        assert "Leg Bye" in c and "2 runs" in c


# ── Feature 8: Dismissed-batsman strike rate ───────────────────────────────

class TestStrikeRate:
    def test_strike_rate_example(self):
        # 40 runs off 29 balls -> 137.93 (matches the spec's example card).
        assert sl.strike_rate(40, 29) == 137.93

    def test_strike_rate_zero_balls(self):
        assert sl.strike_rate(0, 0) == 0.0

    def test_strike_rate_hundred(self):
        assert sl.strike_rate(50, 50) == 100.0


# ── Overs maths ────────────────────────────────────────────────────────────

class TestOvers:
    def test_six_balls_is_one_over(self):
        assert sl.calculate_overs(6) == 1.0

    def test_seven_balls_is_one_dot_one(self):
        assert sl.calculate_overs(7) == 1.1

    def test_thirteen_balls_is_two_dot_one(self):
        assert sl.calculate_overs(13) == 2.1
