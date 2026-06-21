
import { type Match } from "@/types/match-center";
import { useMatchCenter } from "@/hooks/useMatchCenter";
import { VideoPlayer } from "./video-player";
import { ScoreRibbon } from "./score-ribbon";
import { MatchInfoCard } from "./match-info-card";
import { OverProgress } from "./over-progress";
import { LiveScorecard } from "./live-scorecard";
import { SidebarMatchCard } from "./sidebar-match-card";

// ── Date/time sorting helpers ──────────────────────────────────────────
// match.date comes from the backend as "27 Jun 2026" and match.time as
// "9:00 am" / "8:00 pm". These are display strings, so we parse them
// here just to get a sortable timestamp — we don't touch how they're
// fetched or rendered.

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDateStr(dateStr?: string): { day: number; month: number; year: number } | null {
  if (!dateStr || dateStr === "TBD") return null;
  const parts = dateStr.trim().split(/\s+/); // ["27", "Jun", "2026"]
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTHS[parts[1]];
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return null;
  return { day, month, year };
}

function parseTimeStr(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr || timeStr === "TBD") return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const period = m[3].toLowerCase();
  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  return { hours, minutes };
}

// Returns a sortable timestamp. Matches with an unparseable/missing date
// are pushed to the end so they don't disrupt the chronological order.
function getMatchTimestamp(match: Match): number {
  const d = parseDateStr(match.date);
  if (!d) return Number.POSITIVE_INFINITY;
  const t = parseTimeStr(match.time) ?? { hours: 0, minutes: 0 };
  return new Date(d.year, d.month, d.day, t.hours, t.minutes).getTime();
}

function sortMatchesAscending(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => getMatchTimestamp(a) - getMatchTimestamp(b));
}

export function MatchCenter() {
  const {
    liveMatches,
    upcomingMatches,
    recentMatches,
    activeMatch,
    setActiveId,
    loading,
    error,
    isLive,
    isConnected,
    hasMatches,
    refresh,
  } = useMatchCenter();

  const active = activeMatch;

  // Sort each sidebar section ascending by date + time
  // (e.g. 25 Jun 9:00 am → 25 Jun 10:00 am → ... → 28 Jun).
  const sortedLiveMatches = sortMatchesAscending(liveMatches);
  const sortedUpcomingMatches = sortMatchesAscending(upcomingMatches);
  const sortedRecentMatches = sortMatchesAscending(recentMatches);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FFFDF5", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E53935", animation: "live-pulse 1.4s ease-in-out infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A10" }}>
            Loading match center…
          </span>
        </div>
      </div>
    );
  }

  if (!hasMatches || !active) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FFFDF5", padding: "0 16px" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{
            margin: "0 auto 16px", width: 48, height: 48, borderRadius: 12,
            display: "grid", placeItems: "center",
            background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.3)",
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#E53935" }}>C</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1A1200", marginBottom: 8 }}>
            {error ? "Couldn't load matches" : "No matches yet"}
          </h1>
          <p style={{ fontSize: 13, color: "#5C4A10", lineHeight: 1.6 }}>
            {error
              ? "We couldn't reach the scoring service. Please try again."
              : "Live, upcoming and completed matches will appear here once scheduled."}
          </p>
          <button onClick={refresh} style={{
            marginTop: 20, background: "#E53935", color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 24px",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
          }}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-shell" style={{ minHeight: "100vh", background: "#FFFDF5" }}>

      {/* ── Responsive CSS ──────────────────────────────────────────────
          Breakpoints:
            <480px   phone (base styles below)
            480–767  large phone / small tablet (portrait)
            768–1023 tablet (portrait/landscape) — still stacked, roomier
            1024–1439 small/laptop desktop — 2-column layout begins
            1440+    large desktop / 4K — wider shell, bigger type
      ── */}
      <style>{`
        .mc-shell        { padding-bottom: 32px; }
        .mc-header       { position: sticky; top: 64px; }
        .mc-container    { max-width: 1200px; margin: 0 auto; padding: 0 12px; }
        .mc-header-inner { padding: 8px 12px; gap: 8px; }
        .mc-logo         { width: 32px; height: 32px; border-radius: 7px; }
        .mc-logo-text    { font-size: 14px; }
        .mc-header-title { font-size: 14px; }
        .mc-header-sub   { font-size: 9px; }
        .mc-live-pill    { font-size: 9px; padding: 4px 8px; }
        .mc-meta-strip   { padding: 8px 12px; }
        .mc-match-title  { font-size: 16px; max-width: 100%; overflow-wrap: anywhere; }
        .mc-main-pad     { padding: 12px 10px 32px; }
        .mc-grid         { display: flex; flex-direction: column; gap: 14px; }
        .mc-sidebar      { display: flex; flex-direction: column; }
        .mc-sidebar-panel { display: flex; flex-direction: column; gap: 14px; }
        .mc-section-gap  { gap: 14px; }

        /* Large phone / small tablet portrait */
        @media (min-width: 480px) {
          .mc-container    { padding: 0 16px; }
          .mc-header-inner { padding: 10px 16px; }
          .mc-header-title { font-size: 16px; }
          .mc-meta-strip   { padding: 10px 16px; }
          .mc-match-title  { font-size: 18px; }
          .mc-main-pad     { padding: 14px 14px 40px; }
        }

        /* Tablet — still stacked (video needs full width to stay watchable),
           but spacing/typography step up toward desktop scale. */
        @media (min-width: 768px) {
          .mc-logo         { width: 38px; height: 38px; border-radius: 9px; }
          .mc-logo-text    { font-size: 17px; }
          .mc-header-title { font-size: 17px; }
          .mc-header-sub   { font-size: 10px; }
          .mc-live-pill    { font-size: 10px; padding: 4px 10px; }
          .mc-header-inner { padding: 12px 20px; }
          .mc-meta-strip   { padding: 14px 20px; }
          .mc-match-title  { font-size: 20px; }
          .mc-grid         { gap: 18px; }
          .mc-section-gap  { gap: 18px; }
          .mc-main-pad     { padding: 16px 20px 44px; }
        }

        /* Small/laptop desktop — sidebar appears, 2-column grid begins.
           The site navbar (Navbar.tsx) is h-16 (64px) below this breakpoint
           but lg:h-20 (80px) at 1024px+, so this header's sticky offset has
           to step up here too or its top edge gets hidden under the navbar. */
        @media (min-width: 1024px) {
          .mc-header       { top: 80px; }
          .mc-header-inner { padding: 14px 24px; }
          .mc-meta-strip   { padding: 16px 24px; }
          .mc-header-title { font-size: 18px; }
          .mc-match-title  { font-size: 22px; }
          .mc-grid         { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
          .mc-sidebar      { position: sticky; top: 146px; }
          .mc-sidebar-panel {
            max-height: calc(100vh - 166px);
            overflow-y: auto;
            padding: 14px 14px 20px;
            border: 1px solid rgba(166,124,0,0.18);
            border-radius: 14px;
            background: rgba(255,255,255,0.5);
          }
          .mc-section-gap  { gap: 20px; }
          .mc-main-pad     { padding: 16px 24px 48px; }
        }

        /* Large desktop / large laptop — give the sidebar a bit more room
           and let the shell breathe without the video column ballooning
           past a comfortable reading width. */
        @media (min-width: 1440px) {
          .mc-container    { max-width: 1360px; }
          .mc-grid         { grid-template-columns: 1fr 380px; gap: 32px; max-width: 1360px; margin: 0 auto; }
          .mc-main-pad     { padding: 20px 32px 56px; }
        }

        /* Large desktop / 4K — wider shell again, content still capped to
           a sane max-width so the video/scorecard column never stretches
           into an unreadable ultra-wide block. */
        @media (min-width: 1920px) {
          .mc-container    { max-width: 1520px; }
          .mc-grid         { grid-template-columns: 1fr 420px; max-width: 1520px; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="mc-header" style={{
        zIndex: 30,
        borderBottom: "1px solid rgba(26,18,0,0.10)",
        background: "rgba(253,246,227,0.92)", backdropFilter: "blur(12px)",
      }}>
        <div className="mc-container mc-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div className="mc-logo" style={{
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg,#E53935,#B71C1C)",
              boxShadow: "0 4px 12px rgba(229,57,53,0.3)", flexShrink: 0,
            }}>
              <span className="mc-logo-text" style={{ fontWeight: 900, color: "#fff" }}>C</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="mc-header-title" style={{ fontWeight: 800, color: "#1A1200", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Cricket Match Center
              </p>
              <p className="mc-header-sub" style={{ letterSpacing: "0.1em", textTransform: "uppercase", color: "#E53935", fontWeight: 700 }}>
                Live broadcast
              </p>
            </div>
          </div>
          <span className="mc-live-pill" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.25)",
            borderRadius: 8,
            fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#E53935", flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E53935", animation: "live-pulse 1.4s ease-in-out infinite" }} />
            {isLive ? `${liveMatches.length} live` : "No live matches"}
          </span>
        </div>
      </header>

      {/* ── Match meta strip ── */}
      <div style={{
        borderBottom: "1px solid rgba(26,18,0,0.08)",
        background: "rgba(253,246,227,0.6)",
      }}>
        <div className="mc-container mc-meta-strip">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px" }}>
            {active.status === "LIVE" && (
              <span style={{
                background: "#E53935", color: "#fff",
                borderRadius: 6, padding: "2px 9px",
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                animation: "live-pulse 1.4s ease-in-out infinite", flexShrink: 0,
              }}>● Live</span>
            )}
            <h1 className="mc-match-title" style={{ fontWeight: 900, color: "#1A1200", lineHeight: 1.2 }}>
              {active.title}
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E53935" }}>
              {active.competition}
            </span>
            {active.venue && active.venue !== "TBD" && (
              <span style={{ fontSize: 11, color: "#5C4A10" }}>· {active.venue}</span>
            )}
            {active.date && active.date !== "TBD" && (
              <span style={{ fontSize: 11, color: "#5C4A10" }}>· {active.date}</span>
            )}
            {active.status === "LIVE" && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: isConnected ? "#16A34A" : "#8A7840",
              }}>
                {isConnected ? "● Real-time" : "○ Auto-refresh"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="mc-container mc-main-pad">
        <div className="mc-grid">

          {/* LEFT — video + scores */}
          <div className="mc-section-gap" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <VideoPlayer match={active} />
            <ScoreRibbon match={active} />
            {active.currentInnings && (
              <>
                <OverProgress match={active} />
                <MatchInfoCard match={active} />
              </>
            )}
            <LiveScorecard match={active} />
          </div>

          {/* RIGHT — sidebar */}
          <aside className="mc-sidebar">
            <div className="mc-sidebar-panel">
              {sortedLiveMatches.length > 0 && (
                <SidebarSection title="Live Now" dot="#E53935">
                  {sortedLiveMatches.map((m) => (
                    <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                  ))}
                </SidebarSection>
              )}
              {sortedUpcomingMatches.length > 0 && (
                <SidebarSection title="Upcoming" dot="#F59E0B">
                  {sortedUpcomingMatches.map((m) => (
                    <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                  ))}
                </SidebarSection>
              )}
              {sortedRecentMatches.length > 0 && (
                <SidebarSection title="Recent Results" dot="#16A34A">
                  {sortedRecentMatches.map((m) => (
                    <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                  ))}
                </SidebarSection>
              )}
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

function SidebarSection({
  title, dot, children,
}: {
  title: string; dot: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1200" }}>
          {title}
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}