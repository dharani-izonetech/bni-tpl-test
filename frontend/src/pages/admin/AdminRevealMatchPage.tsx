import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { loadAllGroupReveals, resetGroupReveal } from "@/lib/groupRevealStorage";
import type { AllGroupReveals, GroupRevealRecord } from "@/lib/groupRevealStorage";
import { GROUPS } from "@/data/tournamentData";
import type { GroupId } from "@/types/tournament";

const GROUP_IDS: GroupId[] = ["A", "B", "C", "D"];

const AdminRevealMatchPage = () => {
  const [reveals,   setReveals]   = useState<AllGroupReveals>({});
  const [loading,   setLoading]   = useState(true);
  const [resetting, setResetting] = useState<GroupId | null>(null);
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const initialized = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await loadAllGroupReveals();
      setReveals(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, []);

  const handleReset = async (gid: GroupId) => {
    setResetting(gid);
    setMsg(null);
    try {
      await resetGroupReveal(gid);
      setReveals(prev => { const next = { ...prev }; delete next[gid]; return next; });
      setMsg({ text: `Group ${gid} reveal reset successfully.`, ok: true });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Reset failed.", ok: false });
    } finally {
      setResetting(null);
    }
  };

  // Summary stats
  const totalGroups    = GROUP_IDS.length;
  const completedCount = GROUP_IDS.filter(g => reveals[g]).length;
  const totalMatches   = GROUP_IDS.reduce((sum, g) => sum + (reveals[g]?.matches?.length ?? 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Loader2 size={36} className="spin" style={{ color: "var(--primary)" }} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Loading reveal data…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>
          Match Control
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", margin: 0 }}>
          Reveal Matches
        </h1>
        <button
          className="admin-btn-secondary"
          onClick={() => void load()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Groups",     value: totalGroups,    icon: "🏏" },
          { label: "Groups Completed", value: completedCount, icon: "✅" },
          { label: "Pending",          value: totalGroups - completedCount, icon: "⏳" },
          { label: "Total Matches",    value: totalMatches,   icon: "⚔️" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          marginBottom: 20, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
          color: msg.ok ? "#166534" : "#991b1b",
          background: msg.ok ? "rgba(22,101,52,0.08)" : "rgba(153,27,27,0.08)",
          border: `1px solid ${msg.ok ? "rgba(22,101,52,0.2)" : "rgba(153,27,27,0.2)"}`,
        }}>
          {msg.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Group cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {GROUP_IDS.map(gid => {
          const record   = reveals[gid];
          const groupDef = GROUPS.find(g => g.id === gid)!;
          const isDone   = !!record;

          return (
            <GroupRevealCard
              key={gid}
              gid={gid}
              groupLabel={groupDef.label}
              teams={groupDef.teams.map(t => t.name)}
              record={record ?? null}
              isDone={isDone}
              isResetting={resetting === gid}
              onReset={() => void handleReset(gid)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Group Reveal Card ─────────────────────────────────────────────────────────
interface GroupRevealCardProps {
  gid: GroupId;
  groupLabel: string;
  teams: string[];
  record: GroupRevealRecord | null;
  isDone: boolean;
  isResetting: boolean;
  onReset: () => void;
}

const GroupRevealCard = ({
  gid, groupLabel, teams, record, isDone, isResetting, onReset,
}: GroupRevealCardProps) => {
  return (
    <div className="admin-form-card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: isDone
          ? "linear-gradient(90deg, #16a34a, #4ade80)"
          : "linear-gradient(90deg, #A67C00, #F0C040)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center",
            background: isDone ? "rgba(22,163,74,0.12)" : "rgba(240,192,64,0.12)",
            fontSize: 16, fontWeight: 700,
            color: isDone ? "#16a34a" : "#A67C00",
            fontFamily: "'Oswald',sans-serif",
          }}>
            {gid}
          </div>
          <div>
            <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              {groupLabel}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
              {teams.length} teams
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
          borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: isDone ? "rgba(22,163,74,0.1)" : "rgba(240,192,64,0.1)",
          color: isDone ? "#16a34a" : "#A67C00",
          border: `1px solid ${isDone ? "rgba(22,163,74,0.25)" : "rgba(240,192,64,0.25)"}`,
        }}>
          {isDone ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {isDone ? "Completed" : "Pending"}
        </div>
      </div>

      {/* Teams list */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
          Teams
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {teams.map(name => {
            const isSelected = record?.selected_team_name === name;
            return (
              <span key={name} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: isSelected ? 700 : 500,
                background: isSelected ? "linear-gradient(135deg,#A67C00,#F0C040)" : "var(--surface-dim)",
                color: isSelected ? "#1A1200" : "var(--text-secondary)",
                border: isSelected ? "none" : "1px solid var(--surface-dim)",
              }}>
                {isSelected ? "★ " : ""}{name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Matches */}
      {isDone && record ? (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>
            Generated Matches ({record.matches.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {record.matches.map(m => (
              <div key={m.match_number} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: "linear-gradient(135deg,rgba(240,232,208,0.9),rgba(240,192,64,0.3))",
                border: "1px solid rgba(166,124,0,0.25)",
              }}>
                <span style={{
                  flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 7px",
                  borderRadius: 6, background: "rgba(166,124,0,0.15)",
                  color: "#5C4A10", letterSpacing: "0.08em",
                }}>
                  M{m.match_number}
                </span>
                <span style={{ flex: 1, fontFamily: "'Oswald',sans-serif", fontSize: 14, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.team1_name}
                </span>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: "#A67C00", padding: "2px 6px", background: "rgba(166,124,0,0.12)", borderRadius: 4 }}>
                  VS
                </span>
                <span style={{ flex: 1, fontFamily: "'Oswald',sans-serif", fontSize: 14, fontWeight: 700, color: "#1A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                  {m.team2_name}
                </span>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 10 }}>
            Last updated: {new Date(record.updated_at).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      ) : (
        <div style={{
          padding: "20px", borderRadius: 10, textAlign: "center",
          background: "rgba(240,192,64,0.06)", border: "1px dashed rgba(166,124,0,0.25)",
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            No reveal done yet for this group.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0", opacity: 0.7 }}>
            Go to the Reveal Match page to spin.
          </p>
        </div>
      )}

      {/* Reset button */}
      {isDone && (
        <button
          className="admin-btn-danger"
          onClick={onReset}
          disabled={isResetting}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isResetting
            ? <><Loader2 size={13} className="spin" /> Resetting…</>
            : <><RotateCcw size={13} /> Reset {groupLabel} Reveal</>
          }
        </button>
      )}
    </div>
  );
};

export default AdminRevealMatchPage;
