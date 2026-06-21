import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tournamentStagesApi } from "../../../api/tournamentStages";
import { scheduleMatchesApi } from "../../../api/services";
import { apiClient } from "../../../api/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a plain "YYYY-MM-DD" + "HH:MM:SS" into a readable string. */
function fmtStageDate(date?: string | null, time?: string | null): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  if (!time) return label;
  const [hh, mm] = time.split(":").map(Number);
  const t = new Date(y, m - 1, d, hh, mm).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  return `${label}, ${t}`;
}

/** Format an ISO timestamp (league matches) in IST. */
function fmtISO(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/** Split an ISO timestamp into date="YYYY-MM-DD" and time="HH:MM" for IST. */
function splitISO(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d).forEach(p => { parts[p.type] = p.value; });
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

// ─── Stage badge colours ──────────────────────────────────────────────────────

const BADGE: Record<string, string> = {
  League:    "bg-blue-900/60 text-blue-200 border border-blue-700/50",
  "Super 12":"bg-purple-900/60 text-purple-200 border border-purple-700/50",
  QF:        "bg-amber-900/60 text-amber-200 border border-amber-700/50",
  SF:        "bg-orange-900/60 text-orange-200 border border-orange-700/50",
  Final:     "bg-red-900/60 text-red-200 border border-red-700/50",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScheduleManagementPage() {
  const [startDate, setStartDate] = useState("");
  const [preferFL, setPreferFL]   = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg]       = useState("");

  const handleGenerate = async () => {
    if (!startDate) { setGenMsg("❌ Please select a start date."); return; }
    setGenLoading(true); setGenMsg("");
    try {
      await tournamentStagesApi.generateSchedule({ start_date: startDate, prefer_floodlight: preferFL });
      setGenMsg("✅ Schedule generated! All matches have been assigned dates and time slots.");
    } catch (e: any) {
      setGenMsg("❌ " + (e?.response?.data?.detail || "Failed to generate schedule"));
    } finally { setGenLoading(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Schedule Management</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Super 12 Matches", value: "12", sub: "6 overs · 60 min" },
          { label: "Quarter Finals",   value: "4",  sub: "8 overs · 90 min" },
          { label: "Semi Finals",      value: "2",  sub: "8 overs · 90 min" },
          { label: "Final",            value: "1",  sub: "8 overs · 90 min" },
        ].map(c => (
          <div key={c.label} className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{c.value}</p>
            <p className="text-sm font-semibold text-white mt-1">{c.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Auto-generate form */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4 max-w-lg">
        <h2 className="text-base font-bold text-white">⚡ Auto-Generate Full Schedule</h2>
        <p className="text-xs text-gray-400">
          Assigns dates &amp; time slots to all Super 12, QF, SF and Final matches.
          Prevents same-team double-booking on the same day.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tournament Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 border border-gray-600 focus:outline-none focus:border-amber-500 text-sm" />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-amber-500"
                checked={preferFL} onChange={e => setPreferFL(e.target.checked)} />
              <span className="text-sm text-gray-300">Prefer Floodlight slots</span>
            </label>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={genLoading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-lg disabled:opacity-50 text-sm">
          {genLoading ? "Generating…" : "⚡ Generate Full Schedule"}
        </button>
        {genMsg && (
          <p className={`text-sm font-medium ${genMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
            {genMsg}
          </p>
        )}
      </div>

      {/* Manual editor — all stages */}
      <AllMatchesEditor />
    </div>
  );
}

// ─── Unified manual date/time editor ─────────────────────────────────────────

function AllMatchesEditor() {
  const qc = useQueryClient();

  // ── Editing state ──
  const [editKey, setEditKey]   = useState<string | null>(null); // `${stage}-${id}`
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // ── Filter ──
  const [stageFilter, setStageFilter] = useState("All");

  // ── Queries ──
  const { data: leagueData, isLoading: leagueLoading } = useQuery({
    queryKey: ["sched-league"],
    queryFn:  () => scheduleMatchesApi.adminAll(),
  });
  const { data: s12Data }   = useQuery({ queryKey: ["sched-s12"],   queryFn: () => tournamentStagesApi.getSuper12Matches() });
  const { data: qfData }    = useQuery({ queryKey: ["sched-qf"],    queryFn: () => tournamentStagesApi.getQFMatches() });
  const { data: sfData }    = useQuery({ queryKey: ["sched-sf"],    queryFn: () => tournamentStagesApi.getSFMatches() });
  const { data: finalData } = useQuery({ queryKey: ["sched-final"], queryFn: () => tournamentStagesApi.getFinal() });
  const { data: teamsData } = useQuery({
    queryKey: ["sched-teams"],
    queryFn:  () => apiClient.get<any>("/teams").then(r => {
      const list: any[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      return Object.fromEntries(list.map((t: any) => [t.id, t]));
    }),
  });

  const teams: Record<string, any> = teamsData ?? {};
  const tName = (id?: string | null) => id && teams[id] ? teams[id].name : "TBD";

  // ── Mutations ──
  const mutLeague = useMutation({
    mutationFn: ({ id, match_date }: { id: string; match_date: string }) =>
      scheduleMatchesApi.update(id, { match_date }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sched-league"] }); toast.success("Updated"); setEditKey(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });
  const mutS12 = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      tournamentStagesApi.updateSuper12Schedule(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sched-s12"] }); toast.success("Updated"); setEditKey(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });
  const mutQF = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      tournamentStagesApi.updateQFSchedule(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sched-qf"] }); toast.success("Updated"); setEditKey(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });
  const mutSF = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      tournamentStagesApi.updateSFSchedule(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sched-sf"] }); toast.success("Updated"); setEditKey(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });
  const mutFinal = useMutation({
    mutationFn: ({ payload }: { payload: object }) =>
      tournamentStagesApi.updateFinalSchedule(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sched-final"] }); toast.success("Updated"); setEditKey(null); },
    onError:   (e: any) => toast.error(e?.response?.data?.detail ?? "Failed"),
  });

  const anyPending = mutLeague.isPending || mutS12.isPending || mutQF.isPending || mutSF.isPending || mutFinal.isPending;

  // ── Normalise all matches into one flat list ──
  function unwrapArr(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
    if (raw.data && raw.data.data !== null && raw.data.data !== undefined) return [raw.data.data];
    return [];
  }

  const leagueRows = (leagueData?.data ?? []).map((m: any) => ({
    _key: `League-${m.id}`, _stage: "League", _isStage: false,
    _label: `${m.team1?.name ?? "TBD"} vs ${m.team2?.name ?? "TBD"}`,
    _displayDT: fmtISO(m.match_date),
    ...m,
  }));

  const s12Rows = unwrapArr(s12Data).map((m: any) => ({
    _key: `Super 12-${m.id}`, _stage: "Super 12", _isStage: true,
    _label: `${tName(m.team1_id)} vs ${tName(m.team2_id)}`,
    _displayDT: fmtStageDate(m.match_date, m.start_time),
    ...m,
  }));

  const qfRows = unwrapArr(qfData).map((m: any) => ({
    _key: `QF-${m.id}`, _stage: "QF", _isStage: true,
    _label: `QF ${m.match_number ?? ""} · ${tName(m.team1_id)} vs ${tName(m.team2_id)}`,
    _displayDT: fmtStageDate(m.match_date, m.start_time),
    ...m,
  }));

  const sfRows = unwrapArr(sfData).map((m: any) => ({
    _key: `SF-${m.id}`, _stage: "SF", _isStage: true,
    _label: `SF ${m.match_number ?? ""} · ${tName(m.team1_id)} vs ${tName(m.team2_id)}`,
    _displayDT: fmtStageDate(m.match_date, m.start_time),
    ...m,
  }));

  const finalRows = unwrapArr(finalData).filter(Boolean).map((m: any) => ({
    _key: `Final-${m.id}`, _stage: "Final", _isStage: true,
    _label: `Final · ${tName(m.team1_id)} vs ${tName(m.team2_id)}`,
    _displayDT: fmtStageDate(m.match_date, m.start_time),
    ...m,
  }));

  const allRows = [
    ...leagueRows.sort((a: any, b: any) => (a.match_number ?? 0) - (b.match_number ?? 0)),
    ...s12Rows,
    ...qfRows,
    ...sfRows,
    ...finalRows,
  ];

  const STAGES = ["All", "League", "Super 12", "QF", "SF", "Final"];
  const visible = stageFilter === "All" ? allRows : allRows.filter((m: any) => m._stage === stageFilter);

  // ── Edit handlers ──
  function startEdit(m: any) {
    setEditKey(m._key);
    if (m._isStage) {
      setEditDate(m.match_date ?? "");
      setEditTime(m.start_time ? m.start_time.slice(0, 5) : "");
    } else {
      const { date, time } = splitISO(m.match_date);
      setEditDate(date);
      setEditTime(time);
    }
  }

  function saveEdit(m: any) {
    if (!editDate || !editTime) { toast.error("Select both date and time"); return; }
    if (!m._isStage) {
      mutLeague.mutate({ id: m.id, match_date: `${editDate}T${editTime}:00+05:30` });
      return;
    }
    const payload = { match_date: editDate, start_time: `${editTime}:00` };
    if      (m._stage === "Super 12") mutS12.mutate({ id: m.id, payload });
    else if (m._stage === "QF")       mutQF.mutate({ id: m.id, payload });
    else if (m._stage === "SF")       mutSF.mutate({ id: m.id, payload });
    else if (m._stage === "Final")    mutFinal.mutate({ payload });
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h2 className="text-base font-bold text-white">All Matches — Manual Date &amp; Time</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Edit date/time for any stage. Changes reflect immediately on the public Matches page.
          </p>
        </div>
        <span className="text-xs text-gray-500">{visible.length} matches</span>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2 flex-wrap px-5 py-3 border-b border-gray-700/50">
        {STAGES.map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              stageFilter === s
                ? "bg-amber-500 text-black"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {leagueLoading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No matches yet for this stage. Generate fixtures first.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 bg-gray-900/40">
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Date &amp; Time (IST)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {visible.map((m: any) => {
                const isEditing = editKey === m._key;
                return (
                  <tr key={m._key} className={`text-gray-200 transition-colors ${isEditing ? "bg-gray-700/60" : "hover:bg-gray-700/30"}`}>

                    {/* Stage badge */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[m._stage] ?? "bg-gray-700 text-gray-300"}`}>
                        {m._stage}
                      </span>
                    </td>

                    {/* Match # */}
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.match_number ?? "—"}</td>

                    {/* Match label */}
                    <td className="px-4 py-3 font-medium max-w-[220px] truncate" title={m._label}>
                      {m._label}
                    </td>

                    {/* Date & Time — inline edit */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="bg-gray-900 text-white rounded-lg px-2.5 py-1.5 border border-amber-500/60 focus:outline-none focus:border-amber-400 text-sm"
                          />
                          <input
                            type="time"
                            value={editTime}
                            onChange={e => setEditTime(e.target.value)}
                            className="bg-gray-900 text-white rounded-lg px-2.5 py-1.5 border border-amber-500/60 focus:outline-none focus:border-amber-400 text-sm"
                          />
                        </div>
                      ) : (
                        <span className={m._displayDT === "—" ? "text-gray-500" : "text-gray-100"}>
                          {m._displayDT}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] rounded px-2 py-0.5 bg-gray-700/70 text-gray-300">
                        {m.status ?? "upcoming"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveEdit(m)}
                            disabled={anyPending}
                            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 text-xs disabled:opacity-50">
                            {anyPending ? "Saving…" : "💾 Save"}
                          </button>
                          <button
                            onClick={() => setEditKey(null)}
                            className="rounded-lg bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 text-xs">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 text-xs transition-colors">
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
