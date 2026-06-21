/**
 * Knockout Management Page — QF / SF / Final
 * Fixes: team names resolved from /teams, winner dropdown with real team names,
 *        result/schedule/teams editing fully wired.
 */
import { useState, useEffect, useCallback } from "react";
import { tournamentStagesApi } from "../../../api/tournamentStages";
import { apiClient } from "../../../api/client";

type Stage = "qf" | "sf" | "final";
type EditMode = "result" | "schedule" | "teams";

interface Team { id: string; name: string; short: string }

function useTeams() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  useEffect(() => {
    apiClient.get<any>("/teams").then(r => {
      const list: Team[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setTeams(Object.fromEntries(list.map(t => [t.id, t])));
    }).catch(() => {});
  }, []);
  return teams;
}

function tName(teams: Record<string, Team>, id?: string | null) {
  if (!id) return "TBD";
  return teams[id] ? `${teams[id].name} (${teams[id].short})` : id.slice(-8);
}

function tShort(teams: Record<string, Team>, id?: string | null) {
  if (!id) return "TBD";
  return teams[id]?.short ?? id.slice(-6);
}

export default function KnockoutManagementPage() {
  const [stage, setStage]       = useState<Stage>("qf");
  const [qfMatches, setQf]      = useState<any[]>([]);
  const [sfMatches, setSf]      = useState<any[]>([]);
  const [final, setFinal]       = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState<{text:string;ok:boolean}|null>(null);
  const [editMatch, setEditMatch] = useState<any>(null);
  const [editMode, setEditMode] = useState<EditMode>("result");
  const [form, setForm]         = useState<any>({});
  const [saving, setSaving]     = useState(false);
  const teams = useTeams();

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [qf, sf, fn] = await Promise.all([
        tournamentStagesApi.getQFMatches(),
        tournamentStagesApi.getSFMatches(),
        tournamentStagesApi.getFinal(),
      ]);
      setQf(qf.data?.data ?? []);
      setSf(sf.data?.data ?? []);
      setFinal(fn.data?.data ?? null);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const stageLabel = (s: Stage = stage) =>
    s === "qf" ? "Quarter Finals" : s === "sf" ? "Semi Finals" : "Final";

  const generate = async () => {
    setLoading(true);
    try {
      if (stage === "qf")       await tournamentStagesApi.generateQF();
      else if (stage === "sf")  await tournamentStagesApi.generateSF();
      else                      await tournamentStagesApi.generateFinal();
      showMsg(`✅ ${stageLabel()} generated!`);
      load();
    } catch (e: any) {
      showMsg("❌ " + (e?.response?.data?.detail ?? "Failed"), false);
    } finally { setLoading(false); }
  };

  const openEdit = (m: any, mode: EditMode) => {
    setEditMatch(m);
    setEditMode(mode);
    // Pre-fill form with existing values
    if (mode === "result") {
      setForm({
        team1_score:   m.team1_score ?? "",
        team2_score:   m.team2_score ?? "",
        team1_wickets: m.team1_wickets ?? "",
        team2_wickets: m.team2_wickets ?? "",
        team1_overs:   m.team1_overs ?? "",
        team2_overs:   m.team2_overs ?? "",
        winner_id:     m.winner_id ?? "",
        status:        "completed",
      });
    } else if (mode === "schedule") {
      setForm({
        match_date:  m.match_date ?? "",
        start_time:  m.start_time ?? "",
        end_time:    m.end_time ?? "",
        ground:      m.ground ?? "",
        match_type:  m.match_type ?? "",
        reason:      "",
      });
    } else {
      setForm({ team1_id: m.team1_id ?? "", team2_id: m.team2_id ?? "", reason: "" });
    }
  };

  const save = async () => {
    if (!editMatch) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      );

      if (editMode === "result") {
        if (stage === "final") await tournamentStagesApi.updateFinalResult(payload);
        else if (stage === "sf") await tournamentStagesApi.updateSFResult(editMatch.id, payload);
        else await tournamentStagesApi.updateQFResult(editMatch.id, payload);
      } else if (editMode === "schedule") {
        if (stage === "final") await tournamentStagesApi.updateFinalSchedule(payload);
        else if (stage === "sf") await tournamentStagesApi.updateSFSchedule(editMatch.id, payload);
        else await tournamentStagesApi.updateQFSchedule(editMatch.id, payload);
      } else {
        if (stage === "final") await tournamentStagesApi.updateFinalTeams(payload);
        else if (stage === "sf") await tournamentStagesApi.updateSFTeams(editMatch.id, payload);
        else await tournamentStagesApi.updateQFTeams(editMatch.id, payload);
      }
      showMsg("✅ Saved successfully.");
      setEditMatch(null);
      setForm({});
      load();
    } catch (e: any) {
      showMsg("❌ " + (e?.response?.data?.detail ?? e?.message ?? "Failed"), false);
    } finally { setSaving(false); }
  };

  const currentMatches: any[] =
    stage === "qf" ? qfMatches :
    stage === "sf" ? sfMatches :
    (final ? [final] : []);

  // Teams in THIS match for winner dropdown
  const matchTeams = (m: any) => {
    const t1 = m.team1_id ? teams[m.team1_id] : null;
    const t2 = m.team2_id ? teams[m.team2_id] : null;
    return { t1, t2 };
  };

  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#111520] text-white p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">🏆 Knockout Management</h1>
        <button onClick={load} className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg">🔄 Refresh</button>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["qf","sf","final"] as Stage[]).map(s => (
          <button key={s} onClick={() => setStage(s)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              stage === s ? "bg-amber-500 text-black" : "bg-[#1a1f2e] border border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}>
            {stageLabel(s)}
          </button>
        ))}
      </div>

      {/* Message */}
      {msg && (
        <div className={`rounded-xl px-5 py-3 text-sm font-medium border ${
          msg.ok ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-200"
                 : "bg-red-950/50 border-red-700/50 text-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Main card */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <h2 className="text-base font-bold text-amber-400">{stageLabel()}</h2>
          <button onClick={generate} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold">
            {loading ? "Generating…" : `⚡ Generate ${stageLabel()}`}
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentMatches.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <div className="text-3xl mb-2">🏟️</div>
              <p>No {stageLabel()} matches yet. Click Generate.</p>
            </div>
          ) : currentMatches.map((m: any) => {
            const { t1, t2 } = matchTeams(m);
            const winnerTeam = m.winner_id ? teams[m.winner_id] : null;
            const isDone = m.status === "completed" || !!m.winner_id;

            return (
              <div key={m.id} className={`rounded-xl p-4 border space-y-3 ${
                isDone ? "bg-emerald-950/20 border-emerald-800/30" : "bg-gray-800/50 border-gray-700/40"
              }`}>
                {/* Match header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-amber-400 font-bold">{m.slot_label || `Match #${m.match_number ?? 1}`}</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      <span className={m.winner_id === m.team1_id ? "text-emerald-400" : ""}>{t1?.name ?? "TBD"}</span>
                      <span className="text-gray-500 mx-2 font-normal text-xs">vs</span>
                      <span className={m.winner_id === m.team2_id ? "text-emerald-400" : ""}>{t2?.name ?? "TBD"}</span>
                    </p>
                    {/* Score */}
                    {(m.team1_score !== null && m.team1_score !== undefined) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {tShort(teams, m.team1_id)}: {m.team1_score}/{m.team1_wickets ?? "?"} ({m.team1_overs ?? "?"} ov)
                        {" · "}
                        {tShort(teams, m.team2_id)}: {m.team2_score}/{m.team2_wickets ?? "?"} ({m.team2_overs ?? "?"} ov)
                      </p>
                    )}
                    {winnerTeam && (
                      <p className="text-xs text-emerald-400 font-semibold mt-1">🏆 {winnerTeam.name} won</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    isDone ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
                           : "bg-gray-700/40 text-gray-400 border-gray-600/50"
                  }`}>{m.status}</span>
                </div>

                {/* Schedule info */}
                <div className="text-[11px] text-gray-500 flex flex-wrap gap-2">
                  {m.match_date && <span>📅 {m.match_date}</span>}
                  {m.start_time && <span>⏰ {m.start_time}</span>}
                  {m.ground     && <span>📍 {m.ground}</span>}
                  {m.match_type && <span>{m.match_type === "floodlight" ? "🌙 Floodlight" : "☀️ Day"}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {(["result","schedule","teams"] as EditMode[]).map(mode => (
                    <button key={mode} onClick={() => openEdit(m, mode)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-colors ${
                        mode === "result"   ? "bg-blue-700 hover:bg-blue-600" :
                        mode === "schedule" ? "bg-purple-700 hover:bg-purple-600" :
                                              "bg-orange-700 hover:bg-orange-600"
                      }`}>
                      {mode === "result" ? "⚡ Result" : mode === "schedule" ? "📅 Schedule" : "👥 Teams"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editMatch && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2330] rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div>
                <h3 className="font-bold text-white capitalize">
                  {editMode === "result" ? "⚡ Enter Result" : editMode === "schedule" ? "📅 Update Schedule" : "👥 Override Teams"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editMatch.slot_label || `Match #${editMatch.match_number ?? 1}`} —{" "}
                  {tShort(teams, editMatch.team1_id)} vs {tShort(teams, editMatch.team2_id)}
                </p>
              </div>
              <button onClick={() => { setEditMatch(null); setForm({}); }}
                className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="px-6 py-4 space-y-3">

              {editMode === "result" && (() => {
                const { t1, t2 } = matchTeams(editMatch);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        [`${t1?.short ?? "T1"} Score`, "team1_score", "number"],
                        [`${t2?.short ?? "T2"} Score`, "team2_score", "number"],
                        [`${t1?.short ?? "T1"} Wickets`, "team1_wickets", "number"],
                        [`${t2?.short ?? "T2"} Wickets`, "team2_wickets", "number"],
                        [`${t1?.short ?? "T1"} Overs`, "team1_overs", "number"],
                        [`${t2?.short ?? "T2"} Overs`, "team2_overs", "number"],
                      ].map(([label, key, type]) => (
                        <div key={key as string}>
                          <label className="block text-xs text-gray-400 mb-1">{label}</label>
                          <input type={type as string} value={form[key as string] ?? ""}
                            onChange={e => f(key as string, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Winner *</label>
                      <select value={form.winner_id ?? ""} onChange={e => f("winner_id", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                        <option value="">— Select winner —</option>
                        {t1 && <option value={t1.id}>{t1.name} ({t1.short})</option>}
                        {t2 && <option value={t2.id}>{t2.name} ({t2.short})</option>}
                      </select>
                    </div>
                  </>
                );
              })()}

              {editMode === "schedule" && (
                <>
                  {[["Date (YYYY-MM-DD)", "match_date", "date"],
                    ["Start Time (HH:MM)", "start_time", "time"],
                    ["End Time (HH:MM)", "end_time", "time"],
                    ["Ground / Venue", "ground", "text"],
                  ].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <input type={type} value={form[key] ?? ""}
                        onChange={e => f(key, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Match Type</label>
                    <select value={form.match_type ?? ""} onChange={e => f("match_type", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                      <option value="">— Select —</option>
                      <option value="day">☀️ Day (Red Ball)</option>
                      <option value="floodlight">🌙 Floodlight (White Ball)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Reason (optional)</label>
                    <input value={form.reason ?? ""} onChange={e => f("reason", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Rescheduled due to rain"
                    />
                  </div>
                </>
              )}

              {editMode === "teams" && (() => {
                const allTeamList = Object.values(teams).sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <>
                    <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
                      ⚠️ Override will replace seeded teams. An audit log entry will be created.
                    </p>
                    {[["Team 1", "team1_id"], ["Team 2", "team2_id"]].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <select value={form[key] ?? ""} onChange={e => f(key, e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                          <option value="">— Select team —</option>
                          {allTeamList.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.short})</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Reason *</label>
                      <input value={form.reason ?? ""} onChange={e => f("reason", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                        placeholder="Reason for override"
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => { setEditMatch(null); setForm({}); }}
                className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm">
                {saving ? "Saving…" : "💾 Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
