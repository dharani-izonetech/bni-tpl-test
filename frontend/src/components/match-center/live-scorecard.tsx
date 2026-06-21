import type { Match, Player, Bowler } from "@/types/match-center";

// ─── Responsive CSS injected once ────────────────────────────────────────────
const SCORECARD_CSS = `
  /* ── Stat boxes ── */
  .sc-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    flex-shrink: 0;
    padding: 3px 2px;
    min-width: 28px;
    width: 28px;
  }
  .sc-stat-wide {
    min-width: 42px;
    width: 42px;
  }
  .sc-stat-val { font-size: 11px; font-weight: 900; line-height: 1.1; }
  .sc-stat-lbl { font-size: 6.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 1px; opacity: 0.8; }

  /* ── Player row ── */
  .sc-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(26,18,0,0.05);
  }
  .sc-row-info { flex: 1; min-width: 0; }
  .sc-row-stats { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }

  /* ── Name line ── */
  .sc-name {
    font-size: 12px;
    font-weight: 700;
    color: #1A1200;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .sc-name-out { text-decoration: line-through; opacity: 0.7; }

  .sc-pill {
    display: inline-flex; align-items: center;
    border-radius: 20px; padding: 1px 6px;
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .sc-sub {
    font-size: 10px;
    color: #5C4A10;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sc-sub-out { color: #E53935; font-weight: 600; }

  /* ── Header ── */
  .sc-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 12px;
    border-bottom: 1px solid rgba(26,18,0,0.08);
  }
  .sc-header-cols {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #5C4A10; white-space: nowrap;
  }
  .sc-header-cols-bowl { color: rgba(255,255,255,0.85); }

  /* ── Card wrapper ── */
  .sc-card {
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(26,18,0,0.10);
    background: #fff;
    box-shadow: 0 1px 4px rgba(26,18,0,0.06);
  }
  .sc-card-bowl {
    border: 1px solid rgba(229,57,53,0.20);
  }

  /* ── Grid: stack on mobile, side-by-side on tablet+ ── */
  .sc-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* ── FOW row ── */
  .sc-fow-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; border-radius: 8px;
    background: rgba(229,57,53,0.05);
    border: 1px solid rgba(229,57,53,0.12);
    gap: 10px;
  }
  .sc-fow-score {
    font-size: 16px; font-weight: 700; color: #E53935; flex-shrink: 0;
  }

  /* ── Responsive overrides ── */
  @media (min-width: 380px) {
    .sc-stat     { min-width: 30px; width: 30px; }
    .sc-stat-wide{ min-width: 46px; width: 46px; }
    .sc-stat-val { font-size: 12px; }
    .sc-stat-lbl { font-size: 7px; }
    .sc-row-stats{ gap: 4px; }
    .sc-name     { font-size: 12.5px; }
  }

  @media (min-width: 480px) {
    .sc-stat     { min-width: 34px; width: 34px; padding: 4px 3px; }
    .sc-stat-wide{ min-width: 50px; width: 50px; }
    .sc-stat-val { font-size: 13px; }
    .sc-stat-lbl { font-size: 7.5px; }
    .sc-row      { padding: 9px 14px; gap: 8px; }
    .sc-row-stats{ gap: 5px; }
    .sc-name     { font-size: 13px; }
    .sc-sub      { font-size: 11px; }
    .sc-header   { padding: 10px 14px; }
    .sc-header-cols { font-size: 10px; }
  }

  @media (min-width: 640px) {
    .sc-grid { grid-template-columns: repeat(2, 1fr); }
    .sc-stat     { min-width: 36px; width: 36px; }
    .sc-stat-wide{ min-width: 54px; width: 54px; }
  }

  @media (min-width: 768px) {
    .sc-stat     { min-width: 38px; width: 38px; padding: 5px 4px; }
    .sc-stat-wide{ min-width: 56px; width: 56px; }
    .sc-stat-val { font-size: 13.5px; }
    .sc-row-stats{ gap: 5px; }
    .sc-row      { padding: 10px 16px; }
    .sc-header   { padding: 11px 16px; }
  }

  /* On very narrow screens (< 340px), hide 4s + 6s columns to prevent overflow */
  @media (max-width: 339px) {
    .sc-hide-xs { display: none !important; }
  }
`;

// ─── Stat colour map ──────────────────────────────────────────────────────────

const ST: Record<string, { bg: string; color: string }> = {
  runs:    { bg: "#E53935", color: "#fff"    },
  balls:   { bg: "#F1F5F9", color: "#5C4A10" },
  fours:   { bg: "#FEF3C7", color: "#7A5A12" },
  sixes:   { bg: "#FFE4D6", color: "#9A3F12" },
  sr:      { bg: "#1A1200", color: "#FFFDF5" },
  overs:   { bg: "#F1F5F9", color: "#5C4A10" },
  runs_b:  { bg: "#FEF3C7", color: "#7A5A12" },
  wickets: { bg: "#E53935", color: "#fff"    },
  econ:    { bg: "#1A1200", color: "#FFFDF5" },
};

const WIDE_KEYS = new Set(["sr", "econ"]);
const XS_HIDE   = new Set(["fours", "sixes"]); // hidden on very small screens

function StatBox({ label, value, sk }: { label: string; value: string | number; sk: string }) {
  const s = ST[sk];
  return (
    <div
      className={`sc-stat${WIDE_KEYS.has(sk) ? " sc-stat-wide" : ""}${XS_HIDE.has(sk) ? " sc-hide-xs" : ""}`}
      style={{ background: s.bg, boxShadow: `0 0 0 1.5px ${s.bg}44` }}
    >
      <span className="sc-stat-val" style={{ color: s.color }}>
        {value ?? "—"}
      </span>
      <span className="sc-stat-lbl" style={{ color: s.color }}>
        {label}
      </span>
    </div>
  );
}

// ─── Batting card ─────────────────────────────────────────────────────────────

function BattingCard({ players, striker, teamName }: {
  players: Player[]; striker?: string; teamName?: string;
}) {
  return (
    <section className="sc-card">
      {/* Header */}
      <header className="sc-header" style={{ background: "#FDF6E3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <span style={{
            display: "grid", placeItems: "center", flexShrink: 0,
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(245,158,11,0.18)", fontSize: 13,
          }}>🏏</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1200" }}>
              Batting
            </p>
            {teamName && (
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5C4A10", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {teamName}
              </p>
            )}
          </div>
        </div>
        <span className="sc-header-cols">R · B · 4s · 6s · SR</span>
      </header>

      {/* Rows */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {players.map((p) => {
          const onStrike = !!(striker && p.name.toLowerCase().includes(striker.toLowerCase()));
          const rowBg = onStrike ? "rgba(229,57,53,0.06)" : "#fff";
          return (
            <li key={p.name} className="sc-row" style={{ background: rowBg }}>
              <div className="sc-row-info">
                {/* Name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
                  <span className={`sc-name${p.isOut ? " sc-name-out" : ""}`}>
                    {p.name}
                  </span>
                  {onStrike && !p.isOut && (
                    <span className="sc-pill" style={{ background: "#E53935", color: "#fff", flexShrink: 0 }}>
                      ● On Strike
                    </span>
                  )}
                  {p.isOut && (
                    <span className="sc-pill" style={{ background: "#1A1200", color: "#fff", flexShrink: 0 }}>
                      OUT
                    </span>
                  )}
                </div>
                {/* Sub-line */}
                {p.isOut ? (
                  <p className={`sc-sub sc-sub-out`}>
                    {p.dismissalType ? p.dismissalType.replace(/_/g, " ") : "dismissed"}
                    {p.bowlerName ? ` b. ${p.bowlerName}` : ""}
                  </p>
                ) : (
                  <p className="sc-sub">{p.balls} ball{p.balls === 1 ? "" : "s"} faced</p>
                )}
              </div>
              <div className="sc-row-stats">
                <StatBox label="R"  value={p.runs}                        sk="runs"  />
                <StatBox label="B"  value={p.balls}                       sk="balls" />
                <StatBox label="4s" value={p.fours ?? 0}                  sk="fours" />
                <StatBox label="6s" value={p.sixes ?? 0}                  sk="sixes" />
                <StatBox label="SR" value={p.strikeRate?.toFixed(1) ?? "—"} sk="sr" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Bowling card ─────────────────────────────────────────────────────────────

function BowlingCard({ bowlers, current, teamName }: {
  bowlers: Bowler[]; current?: string; teamName?: string;
}) {
  return (
    <section className="sc-card sc-card-bowl">
      {/* Header */}
      <header className="sc-header" style={{
        background: "linear-gradient(135deg,#E53935 0%,#B71C1C 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <span style={{
            display: "grid", placeItems: "center", flexShrink: 0,
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)", fontSize: 13,
          }}>🎯</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" }}>
              Bowling
            </p>
            {teamName && (
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {teamName}
              </p>
            )}
          </div>
        </div>
        <span className="sc-header-cols sc-header-cols-bowl">O · R · W · Econ</span>
      </header>

      {/* Rows */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {bowlers.map((b) => {
          const isCurrent = !!(current && b.name.toLowerCase().includes(current.toLowerCase()));
          const rowBg = isCurrent ? "rgba(229,57,53,0.06)" : "#fff";
          return (
            <li key={b.name} className="sc-row" style={{ background: rowBg }}>
              <div className="sc-row-info">
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
                  <span className="sc-name">{b.name}</span>
                  {isCurrent && (
                    <span className="sc-pill" style={{ background: "#E53935", color: "#fff", flexShrink: 0 }}>
                      ● Bowling
                    </span>
                  )}
                </div>
                <p className="sc-sub">
                  {b.wickets} wkt{b.wickets === 1 ? "" : "s"} for {b.runs} runs
                </p>
              </div>
              <div className="sc-row-stats">
                <StatBox label="Ov"   value={b.overs}                      sk="overs"   />
                <StatBox label="R"    value={b.runs}                       sk="runs_b"  />
                <StatBox label="W"    value={b.wickets}                    sk="wickets" />
                <StatBox label="Econ" value={b.economy?.toFixed(2) ?? "—"} sk="econ"    />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Fall of Wickets ──────────────────────────────────────────────────────────

function FallOfWicketsCard({ fallOfWickets }: {
  fallOfWickets: import("@/types/match-center").FallOfWicket[];
}) {
  if (!fallOfWickets.length) return null;
  return (
    <section className="sc-card sc-card-bowl">
      <header className="sc-header" style={{ background: "rgba(229,57,53,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>🔴</span>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1200" }}>
            Fall of Wickets
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#5C4A10", flexShrink: 0 }}>
          {fallOfWickets.length} wkt{fallOfWickets.length !== 1 ? "s" : ""}
        </span>
      </header>
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {fallOfWickets.map((fw) => (
          <div key={fw.wicketNumber} className="sc-fow-row">
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                display: "grid", placeItems: "center", flexShrink: 0,
                width: 22, height: 22, borderRadius: "50%",
                background: "#E53935", color: "#fff",
                fontSize: 9, fontWeight: 900,
              }}>
                {fw.wicketNumber}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fw.batsmanName}
                </p>
                <p style={{ fontSize: 10, color: "#5C4A10" }}>
                  at {fw.runsAtFall} runs · {fw.oversAtFall} overs
                </p>
              </div>
            </div>
            <span className="sc-fow-score">{fw.runsAtFall}/{fw.wicketNumber}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LiveScorecard({ match }: { match: Match }) {
  const batting      = match.scorecard?.batting      ?? [];
  const bowling      = match.scorecard?.bowling      ?? [];
  const fallOfWickets = match.scorecard?.fallOfWickets ?? [];
  if (batting.length === 0 && bowling.length === 0) return null;

  const battingTeam = match.currentInnings?.battingTeam === "B" ? match.teamB : match.teamA;
  const bowlingTeam = match.currentInnings?.battingTeam === "B" ? match.teamA : match.teamB;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{SCORECARD_CSS}</style>

      {/* Batting + Bowling — stack on mobile, side-by-side on ≥640 */}
      <div className="sc-grid">
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
