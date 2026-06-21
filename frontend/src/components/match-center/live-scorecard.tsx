import type { Match, Player, Bowler } from "@/types/match-center";

// ── Inline style constants — no Tailwind dynamic classes ─────────────────

const S = {
  card: {
    overflow: "hidden" as const,
    borderRadius: 16,
    border: "1px solid rgba(26,18,0,0.10)",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(26,18,0,0.06)",
  },
  battingHeader: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(26,18,0,0.08)",
    background: "#FDF6E3",
  },
  bowlingHeader: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(229,57,53,0.20)",
    background: "linear-gradient(135deg,#E53935 0%,#B71C1C 100%)",
  },
  row: (highlighted: boolean): React.CSSProperties => ({
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderBottom: "1px solid rgba(26,18,0,0.05)",
    background: highlighted ? "rgba(229,57,53,0.07)" : "#fff",
    transition: "background 0.15s",
  }),
};

// Stat box — fully inline, no Tailwind class lookups
const STAT_STYLES: Record<string, { bg: string; color: string; ring: string }> = {
  runs:    { bg: "#E53935", color: "#fff",    ring: "rgba(229,57,53,0.4)" },
  balls:   { bg: "#F1F5F9", color: "#5C4A10", ring: "rgba(26,18,0,0.10)" },
  fours:   { bg: "#FEF3C7", color: "#7A5A12", ring: "rgba(217,164,65,0.3)" },
  sixes:   { bg: "#FFE4D6", color: "#9A3F12", ring: "rgba(231,138,74,0.4)" },
  sr:      { bg: "#1A1200", color: "#FFFDF5", ring: "rgba(26,18,0,0.3)" },
  overs:   { bg: "#F1F5F9", color: "#5C4A10", ring: "rgba(26,18,0,0.10)" },
  runs_b:  { bg: "#FEF3C7", color: "#7A5A12", ring: "rgba(217,164,65,0.3)" },
  wickets: { bg: "#E53935", color: "#fff",    ring: "rgba(229,57,53,0.4)" },
  econ:    { bg: "#1A1200", color: "#FFFDF5", ring: "rgba(26,18,0,0.3)" },
};

function StatBox({
  label, value, styleKey, big,
}: {
  label: string; value: string | number; styleKey: keyof typeof STAT_STYLES; big?: boolean;
}) {
  const st = STAT_STYLES[styleKey];
  return (
    <div className="mc-stat-box" style={{
      display: "flex", flexDirection: "column" as const,
      alignItems: "center", justifyContent: "center",
      borderRadius: 8,
      background: st.bg,
      boxShadow: `0 0 0 1.5px ${st.ring}`,
    }}>
      <span style={{ fontWeight: 900, lineHeight: 1, color: st.color }}>
        {value === undefined || value === null ? "—" : value}
      </span>
      <span style={{
        marginTop: 2, fontSize: 7, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase" as const,
        color: st.color, opacity: 0.75,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Batting card ──────────────────────────────────────────────────────────

function BattingCard({
  players, striker, teamName,
}: {
  players: Player[]; striker?: string; teamName?: string;
}) {
  return (
    <section style={S.card}>
      <header style={S.battingHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "grid", placeItems: "center",
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(245,158,11,0.18)", fontSize: 14,
          }}>🏏</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1200" }}>
              Batting
            </p>
            {teamName && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5C4A10" }}>
                {teamName}
              </p>
            )}
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A10" }}>
          R · B · 4s · 6s · SR
        </span>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {players.map((p) => {
          const isOnStrike = !!(striker && p.name.toLowerCase().includes(striker.toLowerCase()));
          return (
            <li key={p.name} style={S.row(isOnStrike)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: "#1A1200",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                    textDecoration: p.isOut ? "line-through" : "none",
                    opacity: p.isOut ? 0.75 : 1,
                  }}>
                    {p.name}
                  </span>
                  {isOnStrike && !p.isOut && (
                    <span style={{
                      background: "#E53935", color: "#fff",
                      borderRadius: 20, padding: "1px 7px",
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    }}>
                      ● On Strike
                    </span>
                  )}
                  {p.isOut && (
                    <span style={{
                      background: "#1A1200", color: "#fff",
                      borderRadius: 20, padding: "1px 7px",
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    }}>
                      OUT
                    </span>
                  )}
                </div>
                {/* Dismissal info */}
                {p.isOut ? (
                  <p style={{ fontSize: 11, color: "#E53935", marginTop: 2, fontWeight: 600 }}>
                    {p.dismissalType
                      ? p.dismissalType.replace(/_/g, " ")
                      : "dismissed"}
                    {p.bowlerName ? ` b. ${p.bowlerName}` : ""}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: "#5C4A10", marginTop: 2 }}>
                    {p.balls} ball{p.balls === 1 ? "" : "s"} faced
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <StatBox label="R"  value={p.runs}              styleKey="runs"  big />
                <StatBox label="B"  value={p.balls}             styleKey="balls" />
                <StatBox label="4s" value={p.fours ?? 0}        styleKey="fours" />
                <StatBox label="6s" value={p.sixes ?? 0}        styleKey="sixes" />
                <StatBox label="SR" value={p.strikeRate?.toFixed(1) ?? "—"} styleKey="sr" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Bowling card ──────────────────────────────────────────────────────────

function BowlingCard({
  bowlers, current, teamName,
}: {
  bowlers: Bowler[]; current?: string; teamName?: string;
}) {
  return (
    <section style={{ ...S.card, border: "1px solid rgba(229,57,53,0.20)" }}>
      <header style={S.bowlingHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "grid", placeItems: "center",
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)", fontSize: 14,
          }}>🎯</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" }}>
              Bowling
            </p>
            {teamName && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                {teamName}
              </p>
            )}
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>
          O · R · W · Econ
        </span>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {bowlers.map((b) => {
          const isCurrent = !!(current && b.name.toLowerCase().includes(current.toLowerCase()));
          return (
            <li key={b.name} style={S.row(isCurrent)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {b.name}
                  </span>
                  {isCurrent && (
                    <span style={{
                      background: "#E53935", color: "#fff",
                      borderRadius: 20, padding: "1px 7px",
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    }}>
                      ● Bowling
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#5C4A10", marginTop: 2 }}>
                  {b.wickets} wkt{b.wickets === 1 ? "" : "s"} for {b.runs} runs
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <StatBox label="Ov"   value={b.overs}                      styleKey="overs"   />
                <StatBox label="R"    value={b.runs}                       styleKey="runs_b"  />
                <StatBox label="W"    value={b.wickets}                    styleKey="wickets" big />
                <StatBox label="Econ" value={b.economy?.toFixed(2) ?? "—"} styleKey="econ"    />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Fall of Wickets ───────────────────────────────────────────────────────

function FallOfWicketsCard({ fallOfWickets }: { fallOfWickets: import("@/types/match-center").FallOfWicket[] }) {
  if (!fallOfWickets.length) return null;
  return (
    <section style={{
      ...S.card,
      border: "1px solid rgba(229,57,53,0.20)",
    }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        borderBottom: "1px solid rgba(229,57,53,0.15)",
        background: "rgba(229,57,53,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔴</span>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#1A1200" }}>
            Fall of Wickets
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#5C4A10" }}>
          {fallOfWickets.length} wkt{fallOfWickets.length !== 1 ? "s" : ""}
        </span>
      </header>
      <div style={{ padding: "10px 18px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {fallOfWickets.map((fw) => (
          <div key={fw.wicketNumber} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(229,57,53,0.05)",
            border: "1px solid rgba(229,57,53,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Wicket number badge */}
              <span style={{
                display: "grid", placeItems: "center",
                width: 24, height: 24, borderRadius: "50%",
                background: "#E53935", color: "#fff",
                fontSize: 10, fontWeight: 900, flexShrink: 0,
              }}>
                {fw.wicketNumber}
              </span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1200" }}>
                  {fw.batsmanName}
                </p>
                <p style={{ fontSize: 11, color: "#5C4A10" }}>
                  at {fw.runsAtFall} runs · {fw.oversAtFall} overs
                </p>
              </div>
            </div>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700,
              color: "#E53935",
            }}>
              {fw.runsAtFall}/{fw.wicketNumber}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export function LiveScorecard({ match }: { match: Match }) {
  const batting = match.scorecard?.batting ?? [];
  const bowling = match.scorecard?.bowling ?? [];
  const fallOfWickets = match.scorecard?.fallOfWickets ?? [];
  if (batting.length === 0 && bowling.length === 0) return null;

  const battingTeam = match.currentInnings?.battingTeam === "B" ? match.teamB : match.teamA;
  const bowlingTeam = match.currentInnings?.battingTeam === "B" ? match.teamA : match.teamB;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Responsive stat box sizing */}
      <style>{`
        .mc-stat-box { padding: 4px 6px; min-width: 32px; }
        .mc-stat-box span:first-child { font-size: 12px; }
        @media (min-width: 400px) {
          .mc-stat-box { padding: 5px 8px; min-width: 36px; }
          .mc-stat-box span:first-child { font-size: 13px; }
        }
      `}</style>
      {/* Batting + Bowling side by side */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {batting.length > 0 && (
          <BattingCard
            players={batting}
            striker={match.currentInnings?.striker.name}
            teamName={battingTeam.name}
          />
        )}
        {bowling.length > 0 && (
          <BowlingCard
            bowlers={bowling}
            current={match.currentInnings?.bowler.name}
            teamName={bowlingTeam.name}
          />
        )}
      </div>
      {/* Fall of Wickets */}
      {fallOfWickets.length > 0 && (
        <FallOfWicketsCard fallOfWickets={fallOfWickets} />
      )}
    </div>
  );
}
