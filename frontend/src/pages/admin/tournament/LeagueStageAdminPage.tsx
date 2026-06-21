/**
 * League Stage Admin — complete rewrite
 *
 * Features:
 * - Groups loaded from GET /groups (each has assigned teams)
 * - Matches loaded from GET /matches/admin/all, filtered to group teams
 * - Per-match inline result entry: scores, winner dropdown (only 2 teams), margin
 * - Auto-updates PointsTable after saving a result
 * - Manual points override per team
 * - Readiness banner → link to Super 12 when 10 teams qualified
 * - Match status badge, completed/pending visual distinction
 * - "No groups" empty state with helpful message
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { apiClient } from "../../../api/client";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Team { id: string; name: string; short: string; logo_url?: string | null }
interface Group { id: string; name: string; slug: string; teams: Team[] }
interface BNIMatch {
  id: string; slot?: number;
  team1?: Team | null; team2?: Team | null;
  team1_id?: string | null; team2_id?: string | null;
  match_date?: string | null; venue?: string | null;
  status: string;
  winner_id?: string | null; result_summary?: string | null;
  win_margin?: number | null; win_by?: string | null;
  is_revealed: boolean;
}
interface PointsEntry {
  id: string; team_id: string; group_id: string;
  played: number; won: number; lost: number;
  tied: number; no_result: number; points: number;
  nrr: number; runs_scored: number; runs_conceded: number;
  overs_faced: number; overs_bowled: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const n = (v: unknown) => { const x = Number(v); return isNaN(x) ? 0 : x; };

const parseOvers = (s: string) => {
  if (!s) return 0;
  const [w, b] = s.split(".");
  return n(w) + (b ? n(b) / 6 : 0);
};

const parseRuns = (s: string) => n((s || "").split("/")[0]);

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Inline Result Row ──────────────────────────────────────────────────────

function MatchResultRow({
  match,
  onSaved,
  showToast,
}: {
  match: BNIMatch;
  onSaved: (updated: Partial<BNIMatch>) => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const t1 = match.team1;
  const t2 = match.team2;
  const isDone = match.status === "completed" || !!match.winner_id;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    team1_score: "",
    team2_score: "",
    team1_overs: "",
    team2_overs: "",
    winner_id: match.winner_id ?? "",
    win_margin: match.win_margin?.toString() ?? "",
    win_by: match.win_by ?? "runs",
    result_summary: match.result_summary ?? "",
  });

  // Reset form when match changes (e.g. after save)
  const prevId = useRef(match.id);
  useEffect(() => {
    if (prevId.current !== match.id) {
      prevId.current = match.id;
      setForm({
        team1_score: "", team2_score: "",
        team1_overs: "", team2_overs: "",
        winner_id: match.winner_id ?? "",
        win_margin: match.win_margin?.toString() ?? "",
        win_by: match.win_by ?? "runs",
        result_summary: match.result_summary ?? "",
      });
    }
  }, [match]);

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  // Auto-fill result_summary
  useEffect(() => {
    if (!form.winner_id || form.winner_id === "tie") return;
    const winner = form.winner_id === t1?.id ? t1 : t2;
    if (winner && form.win_margin)
      set("result_summary", `${winner.name} won by ${form.win_margin} ${form.win_by}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.winner_id, form.win_margin, form.win_by]);

  const handleSave = async () => {
    if (!form.winner_id) { showToast("Select a winner first", false); return; }
    setSaving(true);
    try {
      const isTie = form.winner_id === "tie";
      await apiClient.put(`/matches/${match.id}`, {
        status: "completed",
        winner_id: isTie ? null : form.winner_id || null,
        win_margin: isTie ? null : n(form.win_margin) || null,
        win_by: isTie ? null : form.win_by || null,
        result_summary: form.result_summary || null,
      });
      onSaved({
        status: "completed",
        winner_id: isTie ? null : form.winner_id || null,
        win_margin: isTie ? null : n(form.win_margin),
        win_by: isTie ? null : form.win_by,
        result_summary: form.result_summary,
        // pass scores for points calc
        ...({ _t1score: form.team1_score, _t2score: form.team2_score,
              _t1overs: form.team1_overs, _t2overs: form.team2_overs } as any),
      });
      showToast("✅ Result saved");
      setOpen(false);
    } catch (e: any) {
      showToast("❌ " + (e?.response?.data?.detail ?? e?.message ?? "Failed"), false);
    } finally { setSaving(false); }
  };

  const winnerTeam =
    match.winner_id === t1?.id ? t1 :
    match.winner_id === t2?.id ? t2 : null;

  return (
    <div className={`rounded-xl border transition-all ${
      isDone
        ? "bg-emerald-950/20 border-emerald-800/30"
        : "bg-gray-800/50 border-gray-700/40"
    }`}>
      {/* ── Fixture row ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Slot */}
        {match.slot && (
          <span className="text-xs text-gray-600 font-mono w-6 shrink-0">#{match.slot}</span>
        )}

        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className={match.winner_id === t1?.id ? "text-emerald-400" : "text-white"}>
              {t1?.name ?? "TBD"}
            </span>
            <span className="text-gray-500 text-xs font-normal">vs</span>
            <span className={match.winner_id === t2?.id ? "text-emerald-400" : "text-white"}>
              {t2?.name ?? "TBD"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-gray-500">
            {match.match_date && <span>📅 {fmtDate(match.match_date)}</span>}
            {match.venue     && <span>📍 {match.venue}</span>}
            {isDone && winnerTeam && (
              <span className="text-emerald-400 font-medium">
                🏆 {winnerTeam.short} won
                {match.result_summary ? ` — ${match.result_summary}` : ""}
              </span>
            )}
            {isDone && !winnerTeam && match.winner_id === null && (
              <span className="text-yellow-400 font-medium">🤝 Tie / No Result</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
          isDone
            ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
            : match.status === "live"
            ? "bg-red-900/40 text-red-300 border-red-700/50 animate-pulse"
            : "bg-gray-700/40 text-gray-400 border-gray-600/50"
        }`}>
          {isDone ? "completed" : match.status}
        </span>

        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            isDone
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
        >
          {isDone ? "✏️ Edit" : "⚡ Result"}
        </button>
      </div>

      {/* ── Inline form (expands) ── */}
      {open && (
        <div className="border-t border-gray-700/50 px-4 py-4 bg-gray-900/40 rounded-b-xl space-y-4">

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t1?.short ?? "Team 1"} — Score
              </label>
              <input
                value={form.team1_score}
                onChange={e => set("team1_score", e.target.value)}
                placeholder="e.g. 145/6"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t1?.short ?? "Team 1"} — Overs
              </label>
              <input
                value={form.team1_overs}
                onChange={e => set("team1_overs", e.target.value)}
                placeholder="e.g. 20 or 18.3"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t2?.short ?? "Team 2"} — Score
              </label>
              <input
                value={form.team2_score}
                onChange={e => set("team2_score", e.target.value)}
                placeholder="e.g. 132/8"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t2?.short ?? "Team 2"} — Overs
              </label>
              <input
                value={form.team2_overs}
                onChange={e => set("team2_overs", e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
              />
            </div>
          </div>

          {/* Winner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">Winner *</label>
              <select
                value={form.winner_id}
                onChange={e => set("winner_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">— Select —</option>
                {t1 && <option value={t1.id}>{t1.name}</option>}
                {t2 && <option value={t2.id}>{t2.name}</option>}
                <option value="tie">Tie / No Result</option>
              </select>
            </div>

            {form.winner_id && form.winner_id !== "tie" && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Win Margin</label>
                  <input
                    type="number" min={0}
                    value={form.win_margin}
                    onChange={e => set("win_margin", e.target.value)}
                    placeholder="e.g. 13"
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Win By</label>
                  <select
                    value={form.win_by}
                    onChange={e => set("win_by", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="runs">Runs</option>
                    <option value="wickets">Wickets</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Result summary */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Result Summary</label>
            <input
              value={form.result_summary}
              onChange={e => set("result_summary", e.target.value)}
              placeholder="e.g. BNI Prince won by 13 runs"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.winner_id}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-sm"
            >
              {saving ? "Saving…" : "💾 Save Result & Update Points"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Points Override Modal ──────────────────────────────────────────────────

interface PtsForm {
  played: number; won: number; lost: number;
  tied: number; no_result: number; points: number;
  nrr: number; runs_scored: number; runs_conceded: number;
  overs_faced: number; overs_bowled: number;
}

function PointsOverrideModal({
  team, groupId, initial, onSave, onClose, saving,
}: {
  team: Team; groupId: string; initial: PtsForm;
  onSave: (v: PtsForm) => void; onClose: () => void; saving: boolean;
}) {
  const [f, setF] = useState<PtsForm>(initial);
  const s = (k: keyof PtsForm, v: string) => setF(p => ({ ...p, [k]: n(v) }));

  const autoCalc = () => {
    const pts = f.won * 2 + f.tied + f.no_result;
    const nrr = f.overs_faced > 0 && f.overs_bowled > 0
      ? f.runs_scored / f.overs_faced - f.runs_conceded / f.overs_bowled : 0;
    setF(p => ({ ...p, points: pts, nrr: parseFloat(nrr.toFixed(3)) }));
  };

  const field = (label: string, key: keyof PtsForm, step = 1) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type="number" step={step} value={f[key]}
        onChange={e => s(key, e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2330] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h3 className="font-bold text-white">Override Points</h3>
            <p className="text-xs text-gray-400 mt-0.5">{team.name} ({team.short})</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Match Results</p>
            <div className="grid grid-cols-3 gap-3">
              {field("Played","played")} {field("Won","won")} {field("Lost","lost")}
              {field("Tied","tied")} {field("No Result","no_result")}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Run / Over Data</p>
            <div className="grid grid-cols-2 gap-3">
              {field("Runs Scored","runs_scored")} {field("Runs Conceded","runs_conceded")}
              {field("Overs Faced","overs_faced",0.1)} {field("Overs Bowled","overs_bowled",0.1)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Points &amp; NRR</p>
              <button onClick={autoCalc} className="text-xs text-amber-400 hover:text-amber-300 underline">⚡ Auto-calculate</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Points","points")} {field("NRR","nrr",0.001)}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
          <button onClick={() => onSave(f)} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm">
            {saving ? "Saving…" : "💾 Override Points"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Card ─────────────────────────────────────────────────────────────

function GroupCard({
  group, matches, pointsMap, onMatchSaved, onOverridePoints,
}: {
  group: Group;
  matches: BNIMatch[];
  pointsMap: Record<string, PointsEntry>;
  onMatchSaved: (matchId: string, updated: Partial<BNIMatch>, group: Group) => void;
  onOverridePoints: (team: Team, entry: PointsEntry | null, groupId: string) => void;
}) {
  const teamIds = new Set(group.teams.map(t => t.id));

  // Matches where BOTH teams are in this group
  const groupMatches = matches.filter(m =>
    m.team1_id && m.team2_id &&
    teamIds.has(m.team1_id) && teamIds.has(m.team2_id)
  );

  // Also include matches where only one team is assigned (partially scheduled)
  const partialMatches = matches.filter(m =>
    !groupMatches.find(gm => gm.id === m.id) &&
    ((m.team1_id && teamIds.has(m.team1_id)) || (m.team2_id && teamIds.has(m.team2_id)))
  );

  const allGroupMatches = [...groupMatches, ...partialMatches];
  const completedCount = allGroupMatches.filter(m => m.status === "completed" || m.winner_id).length;

  const sortedTeams = [...group.teams].sort((a, b) => {
    const pa = pointsMap[a.id], pb = pointsMap[b.id];
    const pA = pa?.points ?? 0, pB = pb?.points ?? 0;
    if (pB !== pA) return pB - pA;
    return (pb?.nrr ?? 0) - (pa?.nrr ?? 0);
  });

  const showToast = (msg: string, ok = true) => {
    // bubble to parent via DOM event for simplicity
    window.dispatchEvent(new CustomEvent("league-toast", { detail: { msg, ok } }));
  };

  return (
    <div className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-700/50 shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#21283a] border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black text-amber-400">{group.name}</h2>
          <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded">{group.slug}</span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{group.teams.length} teams</span>
          <span className="text-gray-700">·</span>
          <span>
            <span className="text-emerald-400 font-bold">{completedCount}</span>/{allGroupMatches.length} matches done
          </span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Points Table ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Points Table</p>
            <p className="text-[10px] text-gray-600">✓ = qualified</p>
          </div>
          <div className="rounded-xl border border-gray-700/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/70 text-[11px] text-gray-500 uppercase">
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-2 py-2">Team</th>
                  <th className="text-center px-2 py-2">P</th>
                  <th className="text-center px-2 py-2">W</th>
                  <th className="text-center px-2 py-2">L</th>
                  <th className="text-center px-2 py-2 text-amber-400">Pts</th>
                  <th className="text-center px-2 py-2">NRR</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, idx) => {
                  const e = pointsMap[team.id];
                  const qual = idx < 2 && (e?.played ?? 0) > 0;
                  return (
                    <tr key={team.id}
                      className={`border-t border-gray-700/30 hover:bg-gray-800/30 transition-colors ${qual ? "bg-emerald-950/20" : ""}`}>
                      <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                        {qual ? <span className="text-emerald-400 font-bold">✓</span> : idx + 1}
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-semibold text-white text-xs">{team.name}</div>
                        <div className="text-[10px] text-gray-500">{team.short}</div>
                      </td>
                      <td className="text-center px-2 text-xs text-gray-300">{e?.played ?? 0}</td>
                      <td className="text-center px-2 text-xs text-emerald-400 font-medium">{e?.won ?? 0}</td>
                      <td className="text-center px-2 text-xs text-red-400">{e?.lost ?? 0}</td>
                      <td className="text-center px-2 text-xs font-bold text-amber-300">{e?.points ?? 0}</td>
                      <td className="text-center px-2 text-[10px] text-gray-400 font-mono">
                        {e ? `${e.nrr >= 0 ? "+" : ""}${e.nrr.toFixed(3)}` : "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => onOverridePoints(team, e ?? null, group.id)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                        >
                          {e ? "Edit" : "Add"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {group.teams.length === 0 && (
            <p className="text-xs text-gray-600 italic mt-2">No teams assigned to this group.</p>
          )}
        </div>

        {/* ── Right: Fixtures ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Fixtures ({allGroupMatches.length})
          </p>
          {allGroupMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-700 rounded-xl">
              <span className="text-2xl mb-2">📅</span>
              <p className="text-xs text-gray-500">No matches scheduled yet.</p>
              <p className="text-[10px] text-gray-600 mt-1">
                Schedule matches via Match Schedule page first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allGroupMatches.map(m => (
                <MatchResultRow
                  key={m.id}
                  match={m}
                  showToast={showToast}
                  onSaved={updated => onMatchSaved(m.id, updated, group)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeagueStageAdminPage() {
  const [groups,     setGroups]     = useState<Group[]>([]);
  const [matches,    setMatches]    = useState<BNIMatch[]>([]);
  const [pointsData, setPointsData] = useState<Record<string, Record<string, PointsEntry>>>({});
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<{ text: string; ok: boolean } | null>(null);

  const [ptsTarget, setPtsTarget] = useState<{ team: Team; groupId: string; entry: PointsEntry | null } | null>(null);
  const [ptsSaving, setPtsSaving] = useState(false);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Listen for toast events from child MatchResultRow components
  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, ok } = (e as CustomEvent).detail;
      showToast(msg, ok);
    };
    window.addEventListener("league-toast", handler);
    return () => window.removeEventListener("league-toast", handler);
  }, [showToast]);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadPoints = useCallback(async (grps: Group[]) => {
    const result: Record<string, Record<string, PointsEntry>> = {};
    await Promise.all(grps.map(async g => {
      try {
        const r = await apiClient.get<any>("/points-table", { params: { group_id: g.id } });
        const rows: PointsEntry[] = Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? [];
        result[g.id] = Object.fromEntries(rows.map(e => [e.team_id, e]));
      } catch { result[g.id] = {}; }
    }));
    return result;
  }, []);

  const [debugInfo, setDebugInfo] = useState<string>("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setDebugInfo("Loading...");
    try {
      // Load groups and matches independently so one failure doesn't kill the other
      let grps: Group[] = [];
      let mts: BNIMatch[] = [];

      try {
        const grpRes = await apiClient.get<any>("/groups");
        const raw = grpRes.data;
        grps = Array.isArray(raw) ? raw : raw?.data ?? [];
        setDebugInfo(`Groups raw keys: ${Object.keys(raw ?? {}).join(", ")} | count: ${grps.length}`);
      } catch (e: any) {
        const msg = `Groups failed — status: ${e?.response?.status ?? "none"}, msg: ${e?.message ?? "?"}`;
        setDebugInfo(msg);
        showToast(`❌ ${msg}`, false);
      }

      try {
        const mtRes = await apiClient.get<any>("/matches/admin/all", { params: { page_size: 500 } });
        mts = Array.isArray(mtRes.data) ? mtRes.data : mtRes.data?.data ?? [];
      } catch {
        try {
          const mtRes2 = await apiClient.get<any>("/matches", { params: { page_size: 500 } });
          mts = Array.isArray(mtRes2.data) ? mtRes2.data : mtRes2.data?.data ?? [];
        } catch { /* no matches */ }
      }

      const pts = await loadPoints(grps);
      setGroups(grps);
      setMatches(mts);
      setPointsData(pts);
      setDebugInfo(`✅ Loaded: ${grps.length} groups, ${mts.length} matches`);
    } catch (e: any) {
      const msg = `Load failed: ${e?.message ?? "Unknown"}`;
      setDebugInfo(msg);
      showToast(`❌ ${msg}`, false);
    } finally { setLoading(false); }
  }, [loadPoints, showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── After match saved, auto-update points ────────────────────────────────
  const matchesRef = useRef(matches);
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  const handleMatchSaved = useCallback(async (
    matchId: string,
    updated: Partial<BNIMatch> & { _t1score?: string; _t2score?: string; _t1overs?: string; _t2overs?: string },
    group: Group,
  ) => {
    // Update local match list
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updated } : m));

    const match = matchesRef.current.find(m => m.id === matchId);
    if (!match) return;

    const t1id = match.team1?.id ?? match.team1_id;
    const t2id = match.team2?.id ?? match.team2_id;
    const isTie = !updated.winner_id;

    const t1runs  = parseRuns(updated._t1score ?? "");
    const t2runs  = parseRuns(updated._t2score ?? "");
    const t1overs = parseOvers(updated._t1overs ?? "");
    const t2overs = parseOvers(updated._t2overs ?? "");

    const existing = pointsData[group.id] ?? {};

    const upsert = async (teamId: string, won: boolean, tied: boolean) => {
      const e = existing[teamId];
      const runsFor     = teamId === t1id ? t1runs  : t2runs;
      const runsAgainst = teamId === t1id ? t2runs  : t1runs;
      const oversF      = teamId === t1id ? t1overs : t2overs;
      const oversB      = teamId === t1id ? t2overs : t1overs;

      const newPlayed = (e?.played ?? 0) + 1;
      const newWon    = (e?.won    ?? 0) + (won  ? 1 : 0);
      const newLost   = (e?.lost   ?? 0) + (!won && !tied ? 1 : 0);
      const newTied   = (e?.tied   ?? 0) + (tied ? 1 : 0);
      const newPts    = newWon * 2 + newTied;
      const newRS     = (e?.runs_scored   ?? 0) + runsFor;
      const newRC     = (e?.runs_conceded ?? 0) + runsAgainst;
      const newOF     = (e?.overs_faced   ?? 0) + oversF;
      const newOB     = (e?.overs_bowled  ?? 0) + oversB;
      const nrr       = newOF > 0 && newOB > 0 ? newRS / newOF - newRC / newOB : 0;

      await apiClient.post("/points-table/upsert", {
        team_id: teamId, group_id: group.id,
        played: newPlayed, won: newWon, lost: newLost,
        tied: newTied, no_result: e?.no_result ?? 0,
        points: newPts, nrr: parseFloat(nrr.toFixed(3)),
        runs_scored: newRS, runs_conceded: newRC,
        overs_faced: parseFloat(newOF.toFixed(2)),
        overs_bowled: parseFloat(newOB.toFixed(2)),
      });
    };

    try {
      if (isTie) {
        if (t1id) await upsert(t1id, false, true);
        if (t2id) await upsert(t2id, false, true);
      } else {
        const loserId = updated.winner_id === t1id ? t2id : t1id;
        if (updated.winner_id) await upsert(updated.winner_id, true, false);
        if (loserId) await upsert(loserId, false, false);
      }
      // Refresh points for this group
      const r = await apiClient.get<any>("/points-table", { params: { group_id: group.id } });
      const rows: PointsEntry[] = Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? [];
      setPointsData(prev => ({
        ...prev,
        [group.id]: Object.fromEntries(rows.map(e => [e.team_id, e])),
      }));
    } catch (e: any) {
      showToast("Points update failed: " + (e?.message ?? ""), false);
    }
  }, [pointsData, showToast]);

  // ── Points override save ────────────────────────────────────────────────
  const handleSavePoints = async (vals: PtsForm) => {
    if (!ptsTarget) return;
    setPtsSaving(true);
    try {
      await apiClient.post("/points-table/upsert", { team_id: ptsTarget.team.id, group_id: ptsTarget.groupId, ...vals });
      const r = await apiClient.get<any>("/points-table", { params: { group_id: ptsTarget.groupId } });
      const rows: PointsEntry[] = Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? [];
      setPointsData(prev => ({
        ...prev,
        [ptsTarget.groupId]: Object.fromEntries(rows.map(e => [e.team_id, e])),
      }));
      showToast(`✅ ${ptsTarget.team.name} points updated.`);
      setPtsTarget(null);
    } catch (e: any) {
      showToast("❌ " + (e?.response?.data?.detail ?? e?.message ?? "Failed"), false);
    } finally { setPtsSaving(false); }
  };

  // ── Readiness ──────────────────────────────────────────────────────────
  const qualifiedCount = groups.reduce((sum, g) => {
    const pts = Object.values(pointsData[g.id] ?? {})
      .sort((a, b) => b.points - a.points || b.nrr - a.nrr);
    return sum + Math.min(2, pts.filter(e => e.played > 0).length);
  }, 0);
  const ready = qualifiedCount >= 10;

  const totalMatches   = groups.reduce((s, g) => {
    const tids = new Set(g.teams.map(t => t.id));
    return s + matches.filter(m => m.team1_id && m.team2_id && tids.has(m.team1_id) && tids.has(m.team2_id)).length;
  }, 0);
  const doneMatches = matches.filter(m => m.status === "completed" || m.winner_id).length;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#111520] text-white">
      <div className="max-w-6xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">🏏 League Stage</h1>
            <p className="text-sm text-gray-400 mt-1">
              Enter match results • Top 2 per group + 2 wildcards → Super 12
            </p>
          </div>
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
            <span className={loading ? "animate-spin inline-block" : ""}>🔄</span>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Stats strip */}
        {!loading && groups.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Groups",    value: groups.length,  color: "text-blue-400"    },
              { label: "Teams",     value: groups.reduce((s, g) => s + g.teams.length, 0), color: "text-purple-400" },
              { label: "Scheduled", value: totalMatches,   color: "text-gray-300"    },
              { label: "Completed", value: doneMatches,    color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1f2e] border border-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Debug info — remove after confirming working */}
        {debugInfo && (
          <div className="rounded-xl px-5 py-3 text-xs font-mono border bg-gray-900/60 border-gray-700 text-gray-400">
            🔍 {debugInfo}
          </div>
        )}

        {/* Readiness banner */}
        <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 border text-sm font-medium ${
          ready
            ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
            : "bg-amber-950/30 border-amber-800/40 text-amber-300"
        }`}>
          <span className="text-lg">{ready ? "✅" : "⏳"}</span>
          <span className="flex-1">
            {ready
              ? `All ${qualifiedCount} qualifying teams identified — ready to generate Super 12.`
              : `${qualifiedCount} / 10 qualifying spots filled. Complete remaining matches.`}
          </span>
          {ready && (
            <a href="/admin/super12"
              className="shrink-0 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">
              Generate Super 12 →
            </a>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`rounded-xl px-5 py-3 text-sm font-medium border ${
            toast.ok
              ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-200"
              : "bg-red-950/50 border-red-700/50 text-red-200"
          }`}>
            {toast.text}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-500">
            <span className="text-4xl animate-spin">⟳</span>
            <span>Loading groups and matches…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-24 bg-[#1a1f2e] rounded-2xl border border-gray-700/50">
            <div className="text-5xl mb-4">🏟️</div>
            <p className="text-lg font-bold text-white">No groups found</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Create groups and assign teams via the Groups section,
              then schedule matches in Match Schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                matches={matches}
                pointsMap={pointsData[g.id] ?? {}}
                onMatchSaved={handleMatchSaved}
                onOverridePoints={(team, entry, groupId) => setPtsTarget({ team, groupId, entry })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Points override modal */}
      {ptsTarget && (
        <PointsOverrideModal
          team={ptsTarget.team}
          groupId={ptsTarget.groupId}
          initial={{
            played:        ptsTarget.entry?.played        ?? 0,
            won:           ptsTarget.entry?.won           ?? 0,
            lost:          ptsTarget.entry?.lost          ?? 0,
            tied:          ptsTarget.entry?.tied          ?? 0,
            no_result:     ptsTarget.entry?.no_result     ?? 0,
            points:        ptsTarget.entry?.points        ?? 0,
            nrr:           ptsTarget.entry?.nrr           ?? 0,
            runs_scored:   ptsTarget.entry?.runs_scored   ?? 0,
            runs_conceded: ptsTarget.entry?.runs_conceded ?? 0,
            overs_faced:   ptsTarget.entry?.overs_faced   ?? 0,
            overs_bowled:  ptsTarget.entry?.overs_bowled  ?? 0,
          }}
          onSave={handleSavePoints}
          onClose={() => setPtsTarget(null)}
          saving={ptsSaving}
        />
      )}
    </div>
  );
}
