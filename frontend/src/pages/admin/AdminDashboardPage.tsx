import { Users, Newspaper, Swords, TrendingUp, Activity, Video, Loader2, Trophy, Shield, Calendar, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlayers } from "@/hooks/usePlayers";
import { useNews }    from "@/hooks/useNews";
import { useEffect, useState } from "react";
import { apiFetch }  from "@/lib/api";

type LiveScore = {
  id: string;
  team1_name: string; team1_short: string; team1_score?: string;
  team2_name: string; team2_short: string; team2_score?: string;
  status: string; is_active: boolean;
};

const AdminDashboardPage = () => {
  const { players, loading: loadingPlayers } = usePlayers();
  const { newsItems, loading: loadingNews }  = useNews();
  const navigate = useNavigate();

  const [liveScores,    setLiveScores]    = useState<LiveScore[]>([]);
  const [mediaCount,    setMediaCount]    = useState<number>(0);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [scoresRes, mediaRes] = await Promise.allSettled([
          apiFetch<{ data: LiveScore[] }>("/live-scores/all"),
          apiFetch<{ meta: { total: number } }>("/media?page_size=1"),
        ]);
        if (scoresRes.status === "fulfilled") setLiveScores(scoresRes.value.data ?? []);
        if (mediaRes.status  === "fulfilled") setMediaCount(mediaRes.value.meta?.total ?? 0);
      } finally {
        setLoadingExtras(false);
      }
    };
    void load();
  }, []);

  const stats = [
    { label: "Total Players",     value: players.length,                            icon: Users,     path: "/admin/players"      },
    { label: "Teams Represented", value: new Set(players.map(p => p.teamName)).size, icon: TrendingUp, path: "/admin/players"     },
    { label: "Total News",        value: newsItems.length,                          icon: Newspaper,  path: "/admin/news"         },
    { label: "Live Score Entries",value: liveScores.length,                         icon: Activity,   path: null                  },
    { label: "Media Files",       value: mediaCount,                                icon: Video,      path: null                  },
    { label: "Reveal Matches",    value: "→",                                       icon: Swords,     path: "/admin/reveal-match" },
  ];


  const tournamentCards = [
    { label: "Super 12",       desc: "Manage groups & fixtures",   icon: Trophy,        path: "/admin/super12"  },
    { label: "Knockout Stages",desc: "QF · SF · Final",            icon: Shield,        path: "/admin/knockout" },
    { label: "Schedule",       desc: "Auto-schedule all matches",   icon: Calendar,      path: "/admin/schedule" },
    { label: "Audit Logs",     desc: "View all admin actions",      icon: ClipboardList, path: "/admin/audit"    },
  ];

  const recentPlayers = players.slice(0, 5);
  const activeLive    = liveScores.filter(s => s.is_active && s.status === "LIVE");

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>Overview</span>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 28 }}>
        Dashboard
      </h1>

      {/* Stats grid */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="admin-stat-card"
              onClick={() => stat.path && navigate(stat.path)}
              style={{ cursor: stat.path ? "pointer" : "default" }}
            >
              <div className="admin-stat-icon"><Icon size={22} /></div>
              <span className="admin-stat-label">{stat.label}</span>
              <span className="admin-stat-value">
                {(loadingPlayers && (stat.label === "Total Players" || stat.label === "Teams Represented")) ||
                 (loadingNews    && stat.label === "Total News") ||
                 (loadingExtras  && (stat.label === "Live Score Entries" || stat.label === "Media Files"))
                  ? <Loader2 size={18} className="spin" />
                  : stat.value
                }
              </span>
            </div>
          );
        })}
      </div>


      {/* ── Tournament Stages ────────────────────────────────────────────── */}
      <div style={{ marginTop: 36, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>Tournament Stages</span>
      </div>
      <h2 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", marginBottom: 16 }}>
        Stage Management
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
        {tournamentCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label}
              onClick={() => navigate(card.path)}
              style={{ background: "var(--card-bg)", borderRadius: 12, padding: "20px 16px", cursor: "pointer",
                border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8,
                transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <Icon size={24} color="var(--primary)" />
              <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}>{card.label}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{card.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Active Live Scores widget */}
      {activeLive.length > 0 && (
        <div className="admin-table-wrap" style={{ marginBottom: 28 }}>
          <div className="admin-table-header">
            <h2 className="admin-table-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} style={{ color: "var(--ipl-red)" }} /> Live Matches Now
            </h2>
          </div>
          <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 16 }}>
            {activeLive.map(s => (
              <div key={s.id} style={{ background: "var(--surface-dim)", borderRadius: 10, padding: "12px 18px", minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ipl-red)", marginBottom: 6, textTransform: "uppercase" }}>● LIVE</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontFamily: "'Oswald',sans-serif", fontSize: 15, fontWeight: 600 }}>
                  <span>{s.team1_short}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>vs</span>
                  <span>{s.team2_short}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13, color: "var(--secondary)", marginTop: 4 }}>
                  <span>{s.team1_score ?? "—"}</span>
                  <span>{s.team2_score ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent registrations */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h2 className="admin-table-title">Recent Registrations</h2>
          {players.length > 5 && (
            <button className="admin-btn-secondary" onClick={() => navigate("/admin/players")}>
              View All ({players.length})
            </button>
          )}
        </div>
        {loadingPlayers ? (
          <div className="admin-empty-state"><Loader2 size={28} className="spin" /><p className="admin-empty-title">Loading...</p></div>
        ) : recentPlayers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><Users size={28} /></div>
            <p className="admin-empty-title">No Players Yet</p>
            <p className="admin-empty-desc">Players appear here after they register.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Team</th><th>Role</th><th>Jersey #</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {recentPlayers.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.teamName}</td>
                    <td>{p.role}</td>
                    <td>{p.jerseyNumber || "—"}</td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {new Date(p.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
