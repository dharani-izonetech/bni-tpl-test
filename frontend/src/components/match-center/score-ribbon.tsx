import type { Match } from "@/types/match-center";
import { TeamBadge } from "./shared";

function TeamCol({
  team,
  isBatting,
  align,
}: {
  team: Match["teamA"];
  isBatting?: boolean;
  align: "left" | "right";
}) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      flexDirection: align === "right" ? "row-reverse" : "row",
      gap: 8,
      padding: "10px 12px",
    }}>
      <TeamBadge short={team.short} color={team.color} size={44} />
      <div style={{ minWidth: 0, textAlign: align === "right" ? "right" : "left" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A10", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {team.name}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
          <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: "#1A1200" }}>
            {team.score ?? "—"}
          </p>
          {team.overs && (
            <p style={{ fontSize: 11, fontWeight: 700, color: "#E53935" }}>
              ({team.overs} ov)
            </p>
          )}
        </div>
        <div style={{ marginTop: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
          {isBatting && (
            <span style={{
              background: "#E53935", color: "#fff",
              borderRadius: 5, padding: "1px 6px",
              fontSize: 8, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              ● Batting
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", textAlign: "center", background: "#fff", flex: 1 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A10" }}>
        {label}
      </p>
      <p style={{ fontSize: 15, fontWeight: 900, color }}>{value}</p>
    </div>
  );
}

export function ScoreRibbon({ match }: { match: Match }) {
  const innings = match.currentInnings;

  return (
    <div style={{
      overflow: "hidden",
      borderRadius: 16,
      border: "1px solid rgba(26,18,0,0.10)",
      background: "#fff",
      boxShadow: "0 2px 16px rgba(26,18,0,0.08)",
    }}>
      {/* Teams row */}
      <div style={{ display: "flex", alignItems: "stretch", background: "linear-gradient(90deg,#FDF6E3,#fff,#FDF6E3)" }}>
        <TeamCol team={match.teamA} isBatting={innings?.battingTeam === "A"} align="left" />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 14px",
          borderLeft: "1px solid rgba(26,18,0,0.10)",
          borderRight: "1px solid rgba(26,18,0,0.10)",
          background: "#1A1200",
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: "#FFFDF5" }}>VS</span>
        </div>
        <TeamCol team={match.teamB} isBatting={innings?.battingTeam === "B"} align="right" />
      </div>

      {/* Stats strip */}
      {innings && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid rgba(26,18,0,0.10)",
          gap: 1,
          background: "rgba(26,18,0,0.10)",
        }}>
          <StatCell label="CRR"    value={innings.runRate.toFixed(2)}                              color="#1A1200" />
          <StatCell label="RRR"    value={innings.requiredRunRate ? innings.requiredRunRate.toFixed(2) : "—"} color="#E53935" />
          <StatCell label="Target" value={innings.target ? String(innings.target) : "—"}           color="#F59E0B" />
          <StatCell label="P'ship" value={`${innings.partnership.runs}(${innings.partnership.balls})`} color="#16A34A" />
        </div>
      )}
    </div>
  );
}
