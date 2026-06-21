/**
 * match-center.ts
 * ----------------------------------------------------------------------------
 * Shared types for the public Match Center (Live Video) page.
 *
 * These were previously defined alongside sample data in `lib/mock-matches.ts`.
 * The Match Center now renders only real backend data, so the types live here
 * independently and the mock file has been removed.
 */

export type BallEventType = "0" | "1" | "2" | "3" | "4" | "6" | "W" | "WD" | "NB";

export interface BallEvent {
  id: string;
  over: string; // e.g. "18.1"
  batter: string;
  description: string;
  type: BallEventType;
  runs?: number;
}

export interface Team {
  name: string;
  short: string;
  color: string; // brand color
  score?: string; // e.g. "182-4"
  overs?: string; // e.g. "18.2"
  captain?: string;
  totalOvers?: number; // format limit, default 20
}

export interface Player {
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  isStriker?: boolean;
  isOut?: boolean;
  dismissalType?: string;
  bowlerName?: string;
}

export interface FallOfWicket {
  wicketNumber: number;
  runsAtFall: number;
  oversAtFall: number;
  batsmanName: string;
}

export interface Bowler {
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy?: number;
}

export type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";

export interface Match {
  id: string;
  status: MatchStatus;
  title: string;
  competition: string;
  venue: string;
  date: string;
  time?: string;
  toss?: string;
  result?: string;
  youtubeId?: string;
  teamA: Team;
  teamB: Team;
  currentInnings?: {
    battingTeam: "A" | "B";
    striker: Player;
    nonStriker: Player;
    bowler: Bowler;
    currentOver: BallEventType[];
    runRate: number;
    requiredRunRate?: number;
    target?: number;
    partnership: { runs: number; balls: number };
  };
  ballByBall?: BallEvent[];
  scorecard?: {
    batting: Player[];
    bowling: Bowler[];
    fallOfWickets?: FallOfWicket[];
  };
}
