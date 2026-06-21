import type { Match, Team } from "@/types/tournament";

/**
 * ROUND-ROBIN — 4 teams per group
 * 5 groups × 4 teams = 20 teams
 * C(4,2) = 6 unique matches per group, zero duplicates
 * ONE SPIN = ALL 6 MATCHES revealed at once
 *
 * Match numbering:
 *   Group A:  1– 6
 *   Group B:  7–12
 *   Group C: 13–18
 *   Group D: 19–24
 *   Group E: 25–30
 */
export function generateRoundRobin(teams: Team[], matchNumberStart: number): Match[] {
  const matches: Match[] = [];
  let num = matchNumberStart;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ matchNumber: num++, groupId: teams[0].groupId, team1: teams[i], team2: teams[j] });
    }
  }
  return matches;
}

/** One spin reveals ALL matches — no partial reveal, no duplicates */
export function getMatchesForSpun(_team: Team, _spinOrder: Team[], allMatches: Match[]): Match[] {
  return [...allMatches];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { generateRoundRobin as generateSelectedTeamMatches, generateRoundRobin as generatePairings };
