import type { Match } from "@/types/match-center";
import { isCaptain } from "./shared";

const CSS = `
  .mi-wrap {
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(26,18,0,0.10);
    background: #fff;
    box-shadow: 0 1px 4px rgba(26,18,0,0.06);
  }
  .mi-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 12px;
    background: #1A1200;
  }
  .mi-header-title {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #FFFDF5;
  }
  .mi-header-pill {
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    background: rgba(229,57,53,0.9); color: #fff;
    padding: 2px 7px; border-radius: 5px;
    white-space: nowrap; flex-shrink: 0;
  }
  /* 1-col on small mobile, 3-col on ≥400px */
  .mi-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    background: rgba(26,18,0,0.08);
  }
  @media (min-width: 400px) {
    .mi-grid { grid-template-columns: repeat(3, 1fr); }
    .mi-header { padding: 10px 14px; }
    .mi-header-title { font-size: 11px; }
  }
  @media (min-width: 480px) {
    .mi-header { padding: 10px 14px; }
  }
  .mi-cell { padding: 10px 12px; background: #fff; }
  .mi-cell-label {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 3px;
  }
  .mi-cell-name {
    font-size: 11px; font-weight: 700; color: #1A1200;
    margin-bottom: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mi-cell-primary {
    font-size: 18px; font-weight: 900; line-height: 1.1; color: #1A1200;
  }
  .mi-cell-sub {
    font-size: 9px; color: #5C4A10; margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  @media (min-width: 380px) {
    .mi-cell-name    { font-size: 12px; }
    .mi-cell-primary { font-size: 19px; }
    .mi-cell-label   { font-size: 9px; }
    .mi-cell-sub     { font-size: 10px; }
  }
  @media (min-width: 480px) {
    .mi-cell { padding: 12px 14px; }
    .mi-cell-primary { font-size: 20px; }
  }
`;

export function MatchInfoCard({ match }: { match: Match }) {
  const innings = match.currentInnings;
  if (!innings) return null;

  const battingTeam = innings.battingTeam === "B" ? match.teamB : match.teamA;
  const bowlingTeam = innings.battingTeam === "B" ? match.teamA : match.teamB;

  return (
    <div className="mi-wrap">
      <style>{CSS}</style>

      <div className="mi-header">
        <h3 className="mi-header-title">Live Match Info</h3>
        <span className="mi-header-pill">Innings 1</span>
      </div>

      <div className="mi-grid">
        <PlayerCell
          label="Striker"
          name={innings.striker.name}
          primary={`${innings.striker.runs}* (${innings.striker.balls})`}
          sub={`SR ${innings.striker.strikeRate?.toFixed(1) ?? "—"} · ${innings.striker.fours ?? 0}×4 · ${innings.striker.sixes ?? 0}×6`}
          accent="#E53935"
          isCap={isCaptain(innings.striker.name, battingTeam.captain)}
        />
        <PlayerCell
          label="Non-Striker"
          name={innings.nonStriker.name}
          primary={`${innings.nonStriker.runs} (${innings.nonStriker.balls})`}
          sub={`SR ${innings.nonStriker.strikeRate?.toFixed(1) ?? "—"} · ${innings.nonStriker.fours ?? 0}×4 · ${innings.nonStriker.sixes ?? 0}×6`}
          accent="#5C4A10"
          isCap={isCaptain(innings.nonStriker.name, battingTeam.captain)}
        />
        <PlayerCell
          label="Bowler"
          name={innings.bowler.name}
          primary={`${innings.bowler.wickets}/${innings.bowler.runs}`}
          sub={`${innings.bowler.overs} ov · Econ ${innings.bowler.economy?.toFixed(2) ?? "—"}`}
          accent="#1A1200"
          isCap={isCaptain(innings.bowler.name, bowlingTeam.captain)}
        />
      </div>
    </div>
  );
}

function PlayerCell({ label, name, primary, sub, accent, isCap }: {
  label: string; name: string; primary: string;
  sub: string; accent: string; isCap?: boolean;
}) {
  return (
    <div className="mi-cell">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
        <p className="mi-cell-label" style={{ color: accent }}>{label}</p>
        {isCap && (
          <span style={{
            display: "grid", placeItems: "center",
            width: 15, height: 15, borderRadius: "50%",
            background: "#E53935", color: "#fff",
            fontSize: 7, fontWeight: 900, flexShrink: 0,
          }}>C</span>
        )}
      </div>
      <p className="mi-cell-name">{name}</p>
      <p className="mi-cell-primary">{primary}</p>
      <p className="mi-cell-sub">{sub}</p>
    </div>
  );
}
