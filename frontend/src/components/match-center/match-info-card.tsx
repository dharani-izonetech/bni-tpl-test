import type { Match } from "@/types/match-center";
import { isCaptain } from "./shared";

export function MatchInfoCard({ match }: { match: Match }) {
  const innings = match.currentInnings;
  if (!innings) return null;

  const battingTeam = innings.battingTeam === "B" ? match.teamB : match.teamA;
  const bowlingTeam = innings.battingTeam === "B" ? match.teamA : match.teamB;

  return (
    <div style={{
      overflow: "hidden",
      borderRadius: 16,
      border: "1px solid rgba(26,18,0,0.10)",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(26,18,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        background: "#1A1200",
      }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FFFDF5" }}>
          Live Match Info
        </h3>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          background: "rgba(229,57,53,0.9)", color: "#fff", padding: "2px 8px", borderRadius: 6,
        }}>
          Innings 1
        </span>
      </div>

      {/* Responsive grid: 1 col mobile → 3 col ≥480px */}
      <style>{`
        .mc-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(26,18,0,0.08);
        }
        @media (min-width: 480px) {
          .mc-info-grid { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>
      <div className="mc-info-grid">
        <PlayerCell
          label="Striker"
          name={innings.striker.name}
          primary={`${innings.striker.runs}* (${innings.striker.balls})`}
          subtitle={`SR ${innings.striker.strikeRate?.toFixed(1) ?? "—"} · ${innings.striker.fours ?? 0}×4 · ${innings.striker.sixes ?? 0}×6`}
          accent="#E53935"
          isCap={isCaptain(innings.striker.name, battingTeam.captain)}
        />
        <PlayerCell
          label="Non-Striker"
          name={innings.nonStriker.name}
          primary={`${innings.nonStriker.runs} (${innings.nonStriker.balls})`}
          subtitle={`SR ${innings.nonStriker.strikeRate?.toFixed(1) ?? "—"} · ${innings.nonStriker.fours ?? 0}×4 · ${innings.nonStriker.sixes ?? 0}×6`}
          accent="#5C4A10"
          isCap={isCaptain(innings.nonStriker.name, battingTeam.captain)}
        />
        <PlayerCell
          label="Bowler"
          name={innings.bowler.name}
          primary={`${innings.bowler.wickets}/${innings.bowler.runs}`}
          subtitle={`${innings.bowler.overs} ov · Econ ${innings.bowler.economy?.toFixed(2) ?? "—"}`}
          accent="#1A1200"
          isCap={isCaptain(innings.bowler.name, bowlingTeam.captain)}
        />
      </div>
    </div>
  );
}

function PlayerCell({
  label, name, primary, subtitle, accent, isCap,
}: {
  label: string; name: string; primary: string;
  subtitle: string; accent: string; isCap?: boolean;
}) {
  return (
    <div style={{ padding: "12px 14px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: accent }}>
          {label}
        </p>
        {isCap && (
          <span style={{
            display: "grid", placeItems: "center",
            width: 16, height: 16, borderRadius: "50%",
            background: "#E53935", color: "#fff", fontSize: 8, fontWeight: 900,
          }}>C</span>
        )}
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1200", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </p>
      <p style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1, color: "#1A1200" }}>{primary}</p>
      <p style={{ fontSize: 10, color: "#5C4A10", marginTop: 2 }}>{subtitle}</p>
    </div>
  );
}
