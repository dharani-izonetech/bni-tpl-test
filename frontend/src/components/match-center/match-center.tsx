import { type Match } from "@/types/match-center";
import { useMatchCenter } from "@/hooks/useMatchCenter";
import { VideoPlayer } from "./video-player";
import { ScoreRibbon } from "./score-ribbon";
import { MatchInfoCard } from "./match-info-card";
import { OverProgress } from "./over-progress";
import { LiveScorecard } from "./live-scorecard";
import { SidebarMatchCard } from "./sidebar-match-card";

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
    <div style={{ minHeight: "100vh", background: "#FFFDF5" }}>

      {/* ── Responsive CSS ── */}
      <style>{`
        .mc-header-title { font-size: 16px; }
        .mc-match-title  { font-size: 18px; }
        .mc-grid         { display: flex; flex-direction: column; gap: 16px; }
        .mc-sidebar      { display: flex; flex-direction: column; gap: 14px; }
        .mc-section-gap  { gap: 14px; }

        @media (min-width: 1024px) {
          .mc-header-title { font-size: 18px; }
          .mc-match-title  { font-size: 22px; }
          .mc-grid         { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
          .mc-sidebar      { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; }
          .mc-section-gap  { gap: 20px; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        borderBottom: "1px solid rgba(26,18,0,0.10)",
        background: "rgba(253,246,227,0.92)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center",
              background: "linear-gradient(135deg,#E53935,#B71C1C)",
              boxShadow: "0 4px 12px rgba(229,57,53,0.3)", flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>C</span>
            </div>
            <div>
              <p className="mc-header-title" style={{ fontWeight: 800, color: "#1A1200", lineHeight: 1.2 }}>
                Cricket Match Center
              </p>
              <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E53935", fontWeight: 700 }}>
                Live broadcast
              </p>
            </div>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.25)",
            borderRadius: 8, padding: "4px 10px",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#E53935",
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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px" }}>
            {active.status === "LIVE" && (
              <span style={{
                background: "#E53935", color: "#fff",
                borderRadius: 6, padding: "2px 9px",
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                animation: "live-pulse 1.4s ease-in-out infinite",
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
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 12px 48px" }}>
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
            {liveMatches.length > 0 && (
              <SidebarSection title="Live Now" dot="#E53935">
                {liveMatches.map((m) => (
                  <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                ))}
              </SidebarSection>
            )}
            {upcomingMatches.length > 0 && (
              <SidebarSection title="Upcoming" dot="#F59E0B">
                {upcomingMatches.map((m) => (
                  <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                ))}
              </SidebarSection>
            )}
            {recentMatches.length > 0 && (
              <SidebarSection title="Recent Results" dot="#16A34A">
                {recentMatches.map((m) => (
                  <SidebarMatchCard key={m.id} match={m} onSelect={() => setActiveId(m.id)} />
                ))}
              </SidebarSection>
            )}
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
