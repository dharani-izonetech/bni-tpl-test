import { Link } from "react-router-dom";
import type { Match } from "@/types/match-center";
import { TeamBadge } from "./shared";

function StatusPill({ status }: { status: Match["status"] }) {
  const bg =
    status === "LIVE"      ? "#E53935" :
    status === "COMPLETED" ? "#16A34A" : "#F59E0B";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 20,
      fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
      background: bg, color: "#fff",
    }}>
      {status === "LIVE" && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "live-pulse 1.4s ease-in-out infinite" }} />
      )}
      {status}
    </span>
  );
}

function TeamRow({ match }: { match: Match }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      {/* Team A */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
        <TeamBadge short={match.teamA.short} color={match.teamA.color} size={30} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {match.teamA.short}
          </p>
          {match.teamA.score ? (
            <p style={{ fontSize: 12, fontWeight: 800, color: "#E53935" }}>
              {match.teamA.score}
              {match.teamA.overs && <span style={{ fontSize: 10, color: "#8A7840" }}> ({match.teamA.overs})</span>}
            </p>
          ) : (
            <p style={{ fontSize: 10, color: "#8A7840" }}>—</p>
          )}
        </div>
      </div>

      <span style={{ fontSize: 9, fontWeight: 800, color: "#8A7840", padding: "0 4px" }}>VS</span>

      {/* Team B */}
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
        <TeamBadge short={match.teamB.short} color={match.teamB.color} size={30} />
        <div style={{ minWidth: 0, textAlign: "right" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {match.teamB.short}
          </p>
          {match.teamB.score ? (
            <p style={{ fontSize: 12, fontWeight: 800, color: "#E53935" }}>
              {match.teamB.score}
              {match.teamB.overs && <span style={{ fontSize: 10, color: "#8A7840" }}> ({match.teamB.overs})</span>}
            </p>
          ) : (
            <p style={{ fontSize: 10, color: "#8A7840" }}>—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CardContent({ match }: { match: Match }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "#fff",
      borderRadius: 12,
      border: "1.5px solid rgba(26,18,0,0.08)",
      boxShadow: "0 1px 4px rgba(26,18,0,0.05)",
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}>
      {/* Status + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <StatusPill status={match.status} />
        <span style={{ fontSize: 10, color: "#8A7840", fontWeight: 600 }}>{match.date}</span>
      </div>

      {/* Teams */}
      <TeamRow match={match} />

      {/* Footer */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(26,18,0,0.06)" }}>
        {match.result ? (
          <p style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            🏆 {match.result}
          </p>
        ) : match.time ? (
          <p style={{ fontSize: 11, fontWeight: 700, color: "#E53935" }}>{match.time}</p>
        ) : (
          <p style={{ fontSize: 11, color: "#5C4A10", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {match.venue || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function SidebarMatchCard({
  match,
  onSelect,
}: {
  match: Match;
  onSelect?: () => void;
}) {
  if (match.status === "COMPLETED") {
    return (
      <Link to={`/live-scores/match/${match.id}`} style={{ display: "block", textDecoration: "none" }}>
        <CardContent match={match} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onSelect} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
      <CardContent match={match} />
    </button>
  );
}
