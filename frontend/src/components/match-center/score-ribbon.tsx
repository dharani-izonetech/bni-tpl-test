import type { Match } from "@/types/match-center";
import { TeamBadge } from "./shared";

const CSS = `
  .sr-wrap {
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(26,18,0,0.10);
    background: #fff;
    box-shadow: 0 2px 16px rgba(26,18,0,0.08);
  }
  /* Teams row */
  .sr-teams {
    display: flex;
    align-items: stretch;
    background: linear-gradient(90deg,#FDF6E3,#fff,#FDF6E3);
  }
  .sr-team {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 10px;
    min-width: 0;
  }
  .sr-team-right { flex-direction: row-reverse; }
  .sr-team-name {
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #5C4A10;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sr-team-score { font-size: 20px; font-weight: 900; line-height: 1; color: #1A1200; }
  .sr-team-overs { font-size: 10px; font-weight: 700; color: #E53935; }
  .sr-batting-pill {
    display: inline-flex; align-items: center;
    background: #E53935; color: #fff;
    border-radius: 5px; padding: 1px 5px;
    font-size: 7px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
    white-space: nowrap;
  }
  .sr-vs {
    display: flex; align-items: center; justify-content: center;
    padding: 0 10px;
    border-left: 1px solid rgba(26,18,0,0.10);
    border-right: 1px solid rgba(26,18,0,0.10);
    background: #1A1200;
    flex-shrink: 0;
  }
  .sr-vs span { font-size: 10px; font-weight: 900; letter-spacing: 0.1em; color: #FFFDF5; }
  /* Stats strip */
  .sr-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid rgba(26,18,0,0.10);
    gap: 1px;
    background: rgba(26,18,0,0.10);
  }
  .sr-stat-cell {
    padding: 8px 6px;
    text-align: center;
    background: #fff;
  }
  .sr-stat-label { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #5C4A10; }
  .sr-stat-value { font-size: 13px; font-weight: 900; margin-top: 2px; }

  @media (min-width: 380px) {
    .sr-team       { gap: 8px; padding: 10px 12px; }
    .sr-team-name  { font-size: 8.5px; }
    .sr-team-score { font-size: 21px; }
    .sr-vs         { padding: 0 12px; }
    .sr-stat-cell  { padding: 9px 8px; }
    .sr-stat-label { font-size: 9px; }
    .sr-stat-value { font-size: 14px; }
  }

  @media (min-width: 480px) {
    .sr-team       { gap: 9px; padding: 11px 14px; }
    .sr-team-name  { font-size: 9px; }
    .sr-team-score { font-size: 22px; }
    .sr-team-overs { font-size: 11px; }
    .sr-batting-pill { font-size: 8px; }
    .sr-vs         { padding: 0 14px; }
    .sr-vs span    { font-size: 11px; }
    .sr-stat-cell  { padding: 10px 10px; }
    .sr-stat-label { font-size: 10px; }
    .sr-stat-value { font-size: 15px; }
  }

  @media (min-width: 640px) {
    .sr-team-score { font-size: 24px; }
  }
`;

export function ScoreRibbon({ match }: { match: Match }) {
  const innings = match.currentInnings;

  return (
    <div className="sr-wrap">
      <style>{CSS}</style>

      {/* Teams row */}
      <div className="sr-teams">
        {/* Team A */}
        <div className="sr-team">
          <TeamBadge short={match.teamA.short} color={match.teamA.color} size={40} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="sr-team-name">{match.teamA.name}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <p className="sr-team-score">{match.teamA.score ?? "—"}</p>
              {match.teamA.overs && (
                <p className="sr-team-overs">({match.teamA.overs} ov)</p>
              )}
            </div>
            {innings?.battingTeam === "A" && (
              <span className="sr-batting-pill">● Batting</span>
            )}
          </div>
        </div>

        {/* VS divider */}
        <div className="sr-vs"><span>VS</span></div>

        {/* Team B */}
        <div className="sr-team sr-team-right">
          <TeamBadge short={match.teamB.short} color={match.teamB.color} size={40} />
          <div style={{ minWidth: 0, flex: 1, textAlign: "right" }}>
            <p className="sr-team-name">{match.teamB.name}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
              <p className="sr-team-score">{match.teamB.score ?? "—"}</p>
              {match.teamB.overs && (
                <p className="sr-team-overs">({match.teamB.overs} ov)</p>
              )}
            </div>
            {innings?.battingTeam === "B" && (
              <span className="sr-batting-pill">● Batting</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip — CRR / RRR / Target / Partnership */}
      {innings && (
        <div className="sr-stats">
          <div className="sr-stat-cell">
            <p className="sr-stat-label">CRR</p>
            <p className="sr-stat-value" style={{ color: "#1A1200" }}>
              {innings.runRate.toFixed(2)}
            </p>
          </div>
          <div className="sr-stat-cell">
            <p className="sr-stat-label">RRR</p>
            <p className="sr-stat-value" style={{ color: "#E53935" }}>
              {innings.requiredRunRate ? innings.requiredRunRate.toFixed(2) : "—"}
            </p>
          </div>
          <div className="sr-stat-cell">
            <p className="sr-stat-label">Target</p>
            <p className="sr-stat-value" style={{ color: "#F59E0B" }}>
              {innings.target ? String(innings.target) : "—"}
            </p>
          </div>
          <div className="sr-stat-cell">
            <p className="sr-stat-label">P'ship</p>
            <p className="sr-stat-value" style={{ color: "#16A34A", fontSize: "clamp(11px,2.5vw,15px)" }}>
              {innings.partnership.runs}({innings.partnership.balls})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
