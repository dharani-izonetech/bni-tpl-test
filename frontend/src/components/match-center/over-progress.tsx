import type { Match, BallEventType } from "@/types/match-center";

const BALL_STYLE: Record<BallEventType, { bg: string; color: string; label: string }> = {
  "0": { bg: "#E2E8F0", color: "#1A1200", label: "0" },
  "1": { bg: "#7C8EA3", color: "#fff",    label: "1" },
  "2": { bg: "#3F8F6E", color: "#fff",    label: "2" },
  "3": { bg: "#2F8F5B", color: "#fff",    label: "3" },
  "4": { bg: "#D9A441", color: "#1A1200", label: "4" },
  "6": { bg: "#E94D47", color: "#fff",    label: "6" },
  W:   { bg: "#1A1200", color: "#fff",    label: "W" },
  WD:  { bg: "#A78BFA", color: "#1A1200", label: "WD" },
  NB:  { bg: "#F472B6", color: "#1A1200", label: "NB" },
};

function parseOvers(overs?: string): { completed: number; balls: number } {
  if (!overs) return { completed: 0, balls: 0 };
  const [c, b] = overs.split(".");
  return { completed: Number(c) || 0, balls: Number(b) || 0 };
}

export function OverProgress({ match }: { match: Match }) {
  const innings = match.currentInnings;
  const battingTeam = innings?.battingTeam === "B" ? match.teamB : match.teamA;
  const totalOvers = battingTeam.totalOvers ?? 20;
  const { completed, balls } = parseOvers(battingTeam.overs);
  const pct = Math.min(100, ((completed + balls / 6) / totalOvers) * 100);
  const oversRemaining = Math.max(0, totalOvers - completed - (balls > 0 ? 1 : 0));
  const ballsBowled: BallEventType[] = innings?.currentOver ?? [];
  const slots: (BallEventType | null)[] = Array.from({ length: 6 }, (_, i) => ballsBowled[i] ?? null);

  return (
    <section style={{
      overflow: "hidden",
      borderRadius: 16,
      border: "1px solid rgba(26,18,0,0.10)",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(26,18,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        borderBottom: "1px solid rgba(26,18,0,0.08)",
        background: "#FDF6E3",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#E53935", animation: "live-pulse 1.4s ease-in-out infinite" }} />
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1200" }}>
            Over Progress
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "#5C4A10" }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, background: "#F0E8D0", color: "#1A1200", fontSize: 12, fontWeight: 800 }}>
            {completed}.{balls}
            <span style={{ color: "#5C4A10", fontWeight: 600 }}> / {totalOvers}.0</span>
          </span>
          <span style={{ fontSize: 11 }}>{oversRemaining} overs left</span>
        </div>
      </div>

      <div style={{ padding: "14px 18px" }}>
        {/* Progress bar */}
        <div style={{ position: "relative", height: 12, borderRadius: 99, background: "#F0E8D0", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 99,
            background: "linear-gradient(90deg,#E53935,#B71C1C)",
            transition: "width 0.7s ease-out",
            position: "relative",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5C4A10" }}>
          <span>Over 1</span>
          <span style={{ color: "#E53935" }}>{pct.toFixed(1)}% complete</span>
          <span>Over {totalOvers}</span>
        </div>

        {/* Current over ball chips */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A10", marginRight: 2 }}>
            Over {completed + 1} <span style={{ color: "#E53935" }}>· {balls}/6</span>
          </p>
          {slots.map((b, i) => {
            if (b === null) {
              return (
                <span key={i} style={{
                  display: "grid", placeItems: "center",
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1.5px dashed rgba(26,18,0,0.18)",
                  fontSize: 9, fontWeight: 700, color: "#8A7840",
                }}>
                  {i + 1}
                </span>
              );
            }
            const st = BALL_STYLE[b];
            return (
              <span key={i} style={{
                display: "grid", placeItems: "center",
                minWidth: 28, height: 28, borderRadius: "50%",
                padding: "0 4px",
                background: st.bg, color: st.color,
                fontSize: 10, fontWeight: 900,
                boxShadow: "0 1px 4px rgba(26,18,0,0.12)",
              }}>
                {st.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
