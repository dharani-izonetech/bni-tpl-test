import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, RotateCcw, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  loadMatchScheduleSnapshotAsync,
  saveMatchScheduleSnapshot,
  updateRevealCount,
  type StoredMatchSlot,
} from "@/lib/matchScheduleStorage";
import { TEAM_DEFS } from "@/data/teamSquads";

// ── Types ──────────────────────────────────────────────────────────────────
type Match = { slot: number; team1: number; team2: number };

const TEAM_NAMES = TEAM_DEFS.map(t => t.name);   // 20 BNI teams
const SLOT_TO_TEAM = TEAM_DEFS.map(t => t.name);  // index → name

// ── Styles (gold/cream theme matching screenshot) ──────────────────────────
const S = {
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#f5f0e8 0%,#ede5d0 100%)",
    padding: "32px 20px 60px",
    fontFamily: "'Segoe UI',sans-serif",
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue','Oswald',sans-serif",
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#2c1a00",
    textAlign: "center" as const,
    marginBottom: 28,
    textTransform: "uppercase" as const,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    maxWidth: 960,
    margin: "0 auto",
  } as React.CSSProperties,
  panel: {
    background: "#f0e8d0",
    border: "1.5px solid #c9a84c",
    borderRadius: 10,
    padding: "22px 24px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
  } as React.CSSProperties,
  panelTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#5a3e00",
    marginBottom: 16,
    borderBottom: "1px solid #c9a84c",
    paddingBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#5a3e00",
    marginBottom: 5,
    display: "block",
  },
  select: {
    width: "100%",
    padding: "9px 12px",
    background: "#faf6ec",
    border: "1.5px solid #c9a84c",
    borderRadius: 6,
    fontSize: 14,
    color: "#2c1a00",
    outline: "none",
    cursor: "pointer",
    marginBottom: 12,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "#faf6ec",
    border: "1.5px solid #c9a84c",
    borderRadius: 6,
    fontSize: 14,
    color: "#2c1a00",
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  btnGold: {
    background: "linear-gradient(135deg,#b8860b,#d4a017)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  btnOutline: {
    background: "transparent",
    color: "#5a3e00",
    border: "1.5px solid #c9a84c",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  matchCard: (revealed: boolean) => ({
    background: revealed
      ? "linear-gradient(135deg,#e8d5a0,#d4b86a)"
      : "linear-gradient(135deg,#f0e8d0,#e0d0a8)",
    border: "1.5px solid #c9a84c",
    borderRadius: 8,
    padding: "14px 18px",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    opacity: revealed ? 1 : 0.65,
    transition: "opacity 0.2s",
  }) as React.CSSProperties,
  matchNo: {
    fontSize: 11,
    fontWeight: 700,
    color: "#5a3e00",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    minWidth: 64,
    flexShrink: 0,
  },
  matchTeam: {
    fontFamily: "'Oswald','Bebas Neue',sans-serif",
    fontSize: 17,
    fontWeight: 700,
    color: "#2c1a00",
    letterSpacing: "0.04em",
  },
  vs: {
    fontSize: 11,
    fontWeight: 800,
    color: "#b8860b",
    padding: "2px 8px",
    background: "rgba(184,134,11,0.12)",
    borderRadius: 4,
    flexShrink: 0,
  },
};

// ── Component ──────────────────────────────────────────────────────────────
const MatchSetupSection = () => {
  const [matches,       setMatches]       = useState<Match[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [team1Idx,      setTeam1Idx]      = useState(0);
  const [team2Idx,      setTeam2Idx]      = useState(1);
  const [focusTeamIdx,  setFocusTeamIdx]  = useState<number | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState("");
  const [loading,       setLoading]       = useState(true);
  const [snapId,        setSnapId]        = useState<string | null>(null);
  const initialized = useRef(false);

  // Load existing schedule on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadMatchScheduleSnapshotAsync().then(snap => {
      if (snap?.schedulePlan?.length) {
        setMatches(snap.schedulePlan.map(m => ({ slot: m.slot, team1: m.team1, team2: m.team2 })));
        setRevealedCount(snap.revealedCount ?? 0);
        setSnapId(snap.id ?? null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Add a match
  const addMatch = () => {
    if (team1Idx === team2Idx) { setMsg("Select two different teams."); return; }
    const already = matches.find(m =>
      (m.team1 === team1Idx && m.team2 === team2Idx) ||
      (m.team1 === team2Idx && m.team2 === team1Idx)
    );
    if (already) { setMsg("This matchup already exists."); return; }
    const next: Match = { slot: matches.length + 1, team1: team1Idx, team2: team2Idx };
    setMatches(prev => [...prev, next]);
    setMsg("");
    // Advance team2 for quick entry
    setTeam2Idx(t => (t + 1) % TEAM_NAMES.length === team1Idx ? (t + 2) % TEAM_NAMES.length : (t + 1) % TEAM_NAMES.length);
  };

  const removeMatch = (slot: number) => {
    const updated = matches
      .filter(m => m.slot !== slot)
      .map((m, i) => ({ ...m, slot: i + 1 }));
    setMatches(updated);
    if (revealedCount > updated.length) setRevealedCount(updated.length);
  };

  // Save to backend
  const save = async () => {
    if (!matches.length) { setMsg("Add at least one match first."); return; }
    setSaving(true);
    setMsg("");
    try {
      const id = await saveMatchScheduleSnapshot({
        slotToTeamName: SLOT_TO_TEAM,
        schedulePlan:   matches,
        revealedCount,
      });
      setSnapId(id);
      setMsg("Schedule saved ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Reveal / hide
  const revealNext = async () => {
    if (revealedCount >= matches.length) return;
    const next = revealedCount + 1;
    setRevealedCount(next);
    try { await updateRevealCount(next, snapId ?? undefined); setMsg(`Match ${next} revealed`); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); }
  };

  const revealAll = async () => {
    setRevealedCount(matches.length);
    try { await updateRevealCount(matches.length, snapId ?? undefined); setMsg("All matches revealed"); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); }
  };

  const resetReveals = async () => {
    if (!window.confirm("Hide all matches from the public?")) return;
    setRevealedCount(0);
    try { await updateRevealCount(0, snapId ?? undefined); setMsg("Reveals reset"); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Reset failed"); }
  };

  // Matches for the focused team
  const focusMatches = focusTeamIdx !== null
    ? matches.filter(m => m.team1 === focusTeamIdx || m.team2 === focusTeamIdx)
    : matches;

  const tName = (idx: number) => TEAM_NAMES[idx] ?? `Team ${idx + 1}`;

  if (loading) {
    return (
      <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={36} style={{ color: "#b8860b", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>Cricket Match Scheduler</h1>

      <div style={S.grid}>
        {/* ── LEFT: Add match ── */}
        <div style={S.panel}>
          <p style={S.panelTitle}>Add Match</p>

          <label style={S.label}>Team 1</label>
          <select
            style={S.select}
            value={team1Idx}
            onChange={e => setTeam1Idx(Number(e.target.value))}
          >
            {TEAM_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>

          <label style={S.label}>Team 2</label>
          <select
            style={S.select}
            value={team2Idx}
            onChange={e => setTeam2Idx(Number(e.target.value))}
          >
            {TEAM_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button style={S.btnGold} onClick={addMatch}>
              <Plus size={14} /> Add Match
            </button>
            <button style={S.btnOutline} onClick={() => { setMatches([]); setRevealedCount(0); setMsg(""); }}>
              <RotateCcw size={13} /> Clear All
            </button>
          </div>

          {msg && (
            <p style={{ fontSize: 12, fontWeight: 600, color: msg.includes("✓") || msg.includes("revealed") ? "#2a7a2a" : "#c0392b", marginBottom: 12 }}>
              {msg}
            </p>
          )}

          {/* Match list */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {matches.length === 0 ? (
              <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "20px 0" }}>
                No matches added yet.
              </p>
            ) : matches.map(m => (
              <div key={m.slot} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5a3e00", minWidth: 28 }}>M{m.slot}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#2c1a00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tName(m.team1)}
                </span>
                <span style={S.vs}>VS</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#2c1a00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                  {tName(m.team2)}
                </span>
                <button
                  onClick={() => removeMatch(m.slot)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", padding: 2, flexShrink: 0 }}
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Save + reveal controls */}
          <div style={{ borderTop: "1px solid #c9a84c", marginTop: 16, paddingTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button style={S.btnGold} onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={13} />}
              {saving ? "Saving…" : "Save Schedule"}
            </button>
            <button style={S.btnOutline} onClick={() => void revealNext()} disabled={revealedCount >= matches.length}>
              <Eye size={13} /> Reveal Next ({revealedCount}/{matches.length})
            </button>
            <button style={S.btnOutline} onClick={() => void revealAll()} disabled={revealedCount >= matches.length}>
              <Eye size={13} /> Reveal All
            </button>
            <button style={S.btnOutline} onClick={() => void resetReveals()} disabled={revealedCount === 0}>
              <EyeOff size={13} /> Reset
            </button>
          </div>
        </div>

        {/* ── RIGHT: Match reveal cards ── */}
        <div style={S.panel}>
          <p style={S.panelTitle}>
            {focusTeamIdx !== null
              ? `Match Reveal Card: ${tName(focusTeamIdx)}`
              : "All Matches"}
          </p>

          {/* Team filter */}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Filter by team</label>
            <select
              style={S.select}
              value={focusTeamIdx ?? ""}
              onChange={e => setFocusTeamIdx(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">— All Teams —</option>
              {TEAM_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>

          {/* Match cards */}
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {focusMatches.length === 0 ? (
              <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "20px 0" }}>
                {matches.length === 0 ? "Add matches on the left." : "No matches for this team."}
              </p>
            ) : focusMatches.map(m => {
              const isRevealed = m.slot <= revealedCount;
              return (
                <div key={m.slot} style={S.matchCard(isRevealed)}>
                  {isRevealed
                    ? <Eye size={13} style={{ color: "#2a7a2a", flexShrink: 0 }} />
                    : <EyeOff size={13} style={{ color: "#888", flexShrink: 0 }} />
                  }
                  <span style={S.matchNo}>Match {m.slot}:</span>
                  <span style={S.matchTeam}>{tName(m.team1)}</span>
                  <span style={S.vs}>VS</span>
                  <span style={S.matchTeam}>{tName(m.team2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MatchSetupSection;
