/**
 * matchCenterAdapter.ts
 * ----------------------------------------------------------------------------
 * Maps the existing backend scoring API responses onto the `Match` shape that
 * the Match Center (public Live Video page) components consume.
 *
 * Backend endpoints used (all already exist — no backend changes required):
 *   GET /scoring/matches/live                 -> live match summaries
 *   GET /scoring/matches?status=<status>      -> match summaries by status
 *   GET /scoring/matches/{id}/live            -> rich live score for one match
 *   GET /scoring/matches/{id}/scorecard       -> full batting/bowling scorecard
 *
 * The Match Center renders real admin/scoring data through these adapters, while keeping
 * the exact same `Match` / `Team` / `Player` / `Bowler` types so none of the
 * presentational components need to change.
 */
import type {
  Match,
  Team,
  Player,
  Bowler,
  BallEvent,
  BallEventType,
  MatchStatus,
} from "@/types/match-center";

/* ─── Status mapping ──────────────────────────────────────────────────────────
 * Backend MatchStatus enum values:
 *   "LIVE", "COMPLETED", "UPCOMING", "scheduled", "toss",
 *   "innings_break", "abandoned", "cancelled"
 * Match Center only knows three buckets, per the spec:
 *   Scheduled / Upcoming  -> UPCOMING
 *   Live / Toss / Break   -> LIVE
 *   Completed             -> COMPLETED
 */
export function mapStatus(raw?: string | null): MatchStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "live" || s === "toss" || s === "innings_break") return "LIVE";
  if (s === "completed" || s === "abandoned" || s === "cancelled")
    return "COMPLETED";
  return "UPCOMING"; // scheduled, upcoming, anything unknown
}

/* ─── Stable per-team brand colour ────────────────────────────────────────────
 * Backend teams have no colour field, so derive a deterministic one from the
 * team name. Same team always gets the same colour across renders.
 */
const TEAM_PALETTE = [
  "#c8102e", "#1a3a6c", "#fdb913", "#004ba0", "#00a651",
  "#7b1fa2", "#e65100", "#00838f", "#5d4037", "#283593",
];
export function teamColor(name?: string | null): string {
  if (!name) return TEAM_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TEAM_PALETTE[h % TEAM_PALETTE.length];
}

function shortName(name?: string | null, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback.trim().toUpperCase();
  if (!name) return "TBD";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

function formatDate(iso?: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "TBD";
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ─── Ball-type → display token ──────────────────────────────────────────────*/
function ballToken(ball: {
  ball_type?: string;
  runs_off_bat?: number;
  total_runs?: number;
  is_wicket?: boolean;
}): BallEventType {
  if (ball.is_wicket) return "W";
  const bt = (ball.ball_type ?? "").toLowerCase();
  if (bt === "wide") return "WD";
  if (bt === "no_ball") return "NB";
  const runs = ball.runs_off_bat ?? ball.total_runs ?? 0;
  if (runs >= 6) return "6";
  if (runs === 4) return "4";
  if (runs === 3) return "3";
  if (runs === 2) return "2";
  if (runs === 1) return "1";
  return "0";
}

function ballDescription(ball: {
  is_wicket?: boolean;
  is_six?: boolean;
  is_boundary?: boolean;
  ball_type?: string;
  total_runs?: number;
}): string {
  if (ball.is_wicket) return "WICKET!";
  if (ball.is_six) return "SIX!";
  if (ball.is_boundary) return "FOUR!";
  const bt = (ball.ball_type ?? "").toLowerCase();
  if (bt === "wide") return "Wide";
  if (bt === "no_ball") return "No ball";
  if (bt === "bye") return `${ball.total_runs ?? 0} bye`;
  const r = ball.total_runs ?? 0;
  if (r === 0) return "Dot ball";
  return `${r} run${r === 1 ? "" : "s"}`;
}

/* ─── Summary adapter (sidebar cards, upcoming, completed lists) ──────────────
 * Input: an object from `_match_to_dict` (list/live/get endpoints).
 */
export function adaptMatchSummary(raw: any): Match {
  const t1 = raw?.team1;
  const t2 = raw?.team2;
  const teamA: Team = {
    name: t1?.name ?? "TBD",
    short: shortName(t1?.name, t1?.short),
    color: teamColor(t1?.name),
    captain: t1?.captain,
    totalOvers: raw?.overs ?? 20,
  };
  const teamB: Team = {
    name: t2?.name ?? "TBD",
    short: shortName(t2?.name, t2?.short),
    color: teamColor(t2?.name),
    captain: t2?.captain,
    totalOvers: raw?.overs ?? 20,
  };

  const status = mapStatus(raw?.status);
  const title =
    teamA.name !== "TBD" || teamB.name !== "TBD"
      ? `${teamA.name} vs ${teamB.name}`
      : raw?.slot
        ? `Match ${raw.slot}`
        : "Cricket Match";

  return {
    id: String(raw?.id ?? ""),
    status,
    title,
    competition: raw?.match_type
      ? `BNI TPL — ${raw.match_type}`
      : "BNI TPL",
    venue: raw?.venue ?? "TBD",
    date: formatDate(raw?.match_date),
    time: formatTime(raw?.match_date),
    result: raw?.result_summary ?? raw?.result ?? undefined,
    teamA,
    teamB,
  };
}

/* ─── Live-detail adapter (full Match Center view of the active match) ────────
 * Input:
 *   live      -> object from GET /scoring/matches/{id}/live
 *   summary   -> optional summary from the list (for venue / competition / date)
 *   scorecard -> optional array from GET /scoring/matches/{id}/scorecard
 */
export function adaptLiveScore(
  live: any,
  summary?: Match,
  scorecard?: any[],
): Match {
  const m = live?.match ?? {};
  const ci = live?.current_innings ?? null;

  const t1 = m.team1;
  const t2 = m.team2;

  // Determine which side is batting in the current innings.
  const battingId = ci?.batting_team_id;
  const team1IsBatting = battingId && t1 && String(battingId) === String(t1.id);
  const battingTeam: "A" | "B" = team1IsBatting ? "A" : "B";

  const inningsScore = (innId: string | undefined) => {
    if (!ci || !innId) return undefined;
    if (String(ci.batting_team_id) !== String(innId)) {
      // look in completed innings_history
      const hist = (live?.innings_history ?? []).find(
        (h: any) => String(h.batting_team_id) === String(innId),
      );
      if (hist) {
        return {
          score: `${hist.total_runs}/${hist.total_wickets}`,
          overs: String(hist.total_overs ?? "0.0"),
        };
      }
      return undefined;
    }
    return {
      score: `${ci.total_runs}/${ci.total_wickets}`,
      overs: String(ci.total_overs ?? "0.0"),
    };
  };

  const a = inningsScore(t1?.id);
  const b = inningsScore(t2?.id);

  const teamA: Team = {
    name: t1?.name ?? summary?.teamA.name ?? "TBD",
    short: shortName(t1?.name, summary?.teamA.short),
    color: teamColor(t1?.name ?? summary?.teamA.name),
    captain: summary?.teamA.captain,
    score: a?.score,
    overs: a?.overs,
    totalOvers: m.overs ?? 20,
  };
  const teamB: Team = {
    name: t2?.name ?? summary?.teamB.name ?? "TBD",
    short: shortName(t2?.name, summary?.teamB.short),
    color: teamColor(t2?.name ?? summary?.teamB.name),
    captain: summary?.teamB.captain,
    score: b?.score,
    overs: b?.overs,
    totalOvers: m.overs ?? 20,
  };

  // current over tokens from last five balls (legal current-over portion)
  const lastFive = (live?.last_five_balls ?? []) as any[];
  const currentOverTokens: BallEventType[] = lastFive.map((ball) =>
    ballToken(ball),
  );

  const ballByBall: BallEvent[] = [...lastFive]
    .reverse()
    .map((ball, idx) => ({
      id: `b-${ball.id ?? idx}`,
      over: `${ball.over_number ?? 0}.${ball.ball_number ?? 0}`,
      batter: live?.striker?.batsman_name ?? "",
      description: ballDescription(ball),
      type: ballToken(ball),
      runs: ball.total_runs ?? ball.runs_off_bat ?? undefined,
    }));

  const toPlayer = (p: any, isStriker = false): Player | undefined => {
    if (!p) return undefined;
    const balls = p.balls_faced ?? 0;
    return {
      name: p.batsman_name ?? "Unknown",
      runs: p.runs ?? 0,
      balls,
      fours: p.fours ?? 0,
      sixes: p.sixes ?? 0,
      strikeRate: balls > 0 ? Math.round(((p.runs ?? 0) / balls) * 1000) / 10 : 0,
      isStriker,
    };
  };

  const toBowler = (b: any): Bowler | undefined => {
    if (!b) return undefined;
    return {
      name: b.bowler_name ?? "Unknown",
      overs: String(b.overs ?? "0.0"),
      runs: b.runs ?? 0,
      wickets: b.wickets ?? 0,
      economy: b.economy_rate ?? 0,
    };
  };

  let currentInnings: Match["currentInnings"];
  if (ci) {
    const striker = toPlayer(live?.striker, true);
    const nonStriker = toPlayer(live?.non_striker);
    const bowler = toBowler(live?.current_bowler);
    if (striker || nonStriker || bowler) {
      currentInnings = {
        battingTeam,
        striker: striker ?? { name: "—", runs: 0, balls: 0, isStriker: true },
        nonStriker: nonStriker ?? { name: "—", runs: 0, balls: 0 },
        bowler: bowler ?? { name: "—", overs: "0.0", runs: 0, wickets: 0 },
        currentOver: currentOverTokens,
        runRate: live?.current_run_rate ?? 0,
        requiredRunRate: live?.required_run_rate ?? undefined,
        target: ci.target ?? undefined,
        partnership: {
          runs: (striker?.runs ?? 0) + (nonStriker?.runs ?? 0),
          balls: (striker?.balls ?? 0) + (nonStriker?.balls ?? 0),
        },
      };
    }
  }

  // Build scorecard from the dedicated endpoint if provided.
  let card: Match["scorecard"];
  if (Array.isArray(scorecard) && scorecard.length) {
    const batting: Player[] = [];
    const bowling: Bowler[] = [];
    const fallOfWickets: import("@/types/match-center").FallOfWicket[] = [];

    for (const inn of scorecard) {
      // Sort batting by batting_position
      const sortedBatting = [...(inn?.batting ?? [])].sort(
        (a: any, b: any) => (a.batting_position ?? 99) - (b.batting_position ?? 99)
      );
      for (const bt of sortedBatting) {
        const balls = bt.balls_faced ?? 0;
        const runs  = bt.runs ?? 0;
        batting.push({
          name: bt.batsman_name ?? "Unknown",
          runs,
          balls,
          fours: bt.fours ?? 0,
          sixes: bt.sixes ?? 0,
          // SR = (runs / balls) * 100, rounded to 1 decimal
          strikeRate: balls > 0 ? Math.round((runs / balls) * 1000) / 10 : 0,
          isOut: bt.is_out ?? false,
          dismissalType: bt.dismissal_type ?? undefined,
          bowlerName: bt.bowler_name ?? undefined,
        });
      }

      for (const bw of inn?.bowling ?? []) {
        // Convert decimal overs (e.g. 3.5) to real overs for economy:
        // 3.5 means 3 complete overs + 5 balls = 3 + 5/6 real overs
        const rawOvers = bw.overs ?? 0;
        const fullOvers = Math.floor(rawOvers);
        const extraBalls = Math.round((rawOvers - fullOvers) * 10); // 3.5 → 5 balls
        const realOvers = fullOvers + extraBalls / 6;
        const economy = realOvers > 0
          ? Math.round(((bw.runs ?? 0) / realOvers) * 100) / 100
          : 0;
        bowling.push({
          name: bw.bowler_name ?? "Unknown",
          overs: String(rawOvers),
          runs: bw.runs ?? 0,
          wickets: bw.wickets ?? 0,
          economy,
        });
      }

      // Deduplicate FOW — same wicket_number OR same batsman can't appear twice
      // (backend records duplicate entries on repeated wicket presses)
      const seenWickets = new Set<number>();
      const seenBatsmen = new Set<string>();
      const rawFow: typeof fallOfWickets = [];
      for (const fw of inn?.fall_of_wickets ?? []) {
        const name = (fw.batsman_name ?? "Unknown").trim().toLowerCase();
        if (seenWickets.has(fw.wicket_number) || seenBatsmen.has(name)) continue;
        seenWickets.add(fw.wicket_number);
        seenBatsmen.add(name);
        rawFow.push({
          wicketNumber: fw.wicket_number,
          runsAtFall:   fw.runs_at_fall,
          oversAtFall:  fw.overs_at_fall,
          batsmanName:  fw.batsman_name ?? "Unknown",
        });
      }
      // Re-number sequentially after dedup so badges show 1,2,3... not 1,2,4...
      rawFow.forEach((fw, idx) => {
        fallOfWickets.push({ ...fw, wicketNumber: idx + 1 });
      });
    }
    if (batting.length || bowling.length) card = { batting, bowling, fallOfWickets };
  }

  const status = mapStatus(m.status);

  return {
    id: String(m.id ?? summary?.id ?? ""),
    status,
    title: summary?.title ?? `${teamA.name} vs ${teamB.name}`,
    competition: summary?.competition ?? "BNI TPL",
    venue: summary?.venue ?? "TBD",
    date: summary?.date ?? formatDate(undefined),
    time: summary?.time,
    toss: summary?.toss,
    result: summary?.result,
    youtubeId: summary?.youtubeId,
    teamA,
    teamB,
    currentInnings,
    ballByBall: ballByBall.length ? ballByBall : undefined,
    scorecard: card,
  };
}
