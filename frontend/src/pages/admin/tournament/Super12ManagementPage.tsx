import React, { useState, useEffect } from "react";
import { tournamentStagesApi } from "../../../api/tournamentStages";
import { apiClient } from "../../../api/client";

interface Team { id: string; name: string; short: string }

function useTeams() {
  const [teams, setTeams] = React.useState<Record<string, Team>>({});
  React.useEffect(() => {
    apiClient.get<any>("/teams").then(r => {
      const list: Team[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setTeams(Object.fromEntries(list.map(t => [t.id, t])));
    }).catch(() => {});
  }, []);
  return teams;
}

interface Group { group: { id: string; name: string }; teams: any[]; points: any[]; matches: any[]; }

export default function Super12ManagementPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [resultForm, setResultForm] = useState<any>({});
  const [schedForm, setSchedForm] = useState<any>({});
  const teams = useTeams();

  const tName = (id?: string) => id && teams[id] ? `${teams[id].name} (${teams[id].short})` : (id?.slice(-8) ?? "TBD");
  const tShort = (id?: string) => id && teams[id] ? teams[id].short : (id?.slice(-6) ?? "TBD");

  const load = async () => {
    try {
      const res = await tournamentStagesApi.getSuper12Groups();
      setGroups(res.data?.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true); setMsg("");
    try {
      await tournamentStagesApi.generateSuper12();
      setMsg("✅ Super12 generated successfully!");
      load();
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.detail || "Failed to generate Super12"));
    } finally { setLoading(false); }
  };

  const saveResult = async () => {
    if (!selectedMatch) return;
    try {
      await tournamentStagesApi.updateSuper12Result(selectedMatch.id, resultForm);
      setMsg("✅ Result saved."); setSelectedMatch(null); setResultForm({});
      load();
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.detail || "Failed"));
    }
  };

  const saveSchedule = async () => {
    if (!selectedMatch) return;
    try {
      await tournamentStagesApi.updateSuper12Schedule(selectedMatch.id, schedForm);
      setMsg("✅ Schedule updated."); setSelectedMatch(null); setSchedForm({});
      load();
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.detail || "Failed"));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Super 12 Management</h1>
        <button
          onClick={generate}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Generating…" : "⚡ Generate Super12"}
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg text-sm font-medium ${msg.startsWith("✅") ? "bg-emerald-900 text-emerald-200" : "bg-red-900 text-red-200"}`}>
          {msg}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.group.id} className="bg-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-amber-400">{g.group.name}</h2>

          {/* Points Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Points Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-200">
                <thead><tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-1 pr-4">Team</th>
                  <th className="text-center px-2">P</th><th className="text-center px-2">W</th>
                  <th className="text-center px-2">L</th><th className="text-center px-2">Pts</th>
                  <th className="text-center px-2">NRR</th>
                </tr></thead>
                <tbody>
                  {g.points.map((p: any, i: number) => (
                    <tr key={p.id} className="border-b border-gray-700/40">
                      <td className="py-1 pr-4">{i + 1}. {tName(p.team_id)}</td>
                      <td className="text-center px-2">{p.played}</td>
                      <td className="text-center px-2">{p.won}</td>
                      <td className="text-center px-2">{p.lost}</td>
                      <td className="text-center px-2 font-bold text-amber-300">{p.points}</td>
                      <td className="text-center px-2">{p.nrr.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matches */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Fixtures</h3>
            <div className="space-y-2">
              {g.matches.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-300">
                    {tShort(m.team1_id)} vs {tShort(m.team2_id)}
                    {m.winner_id && <span className="ml-2 text-emerald-400 font-bold">✓ {tShort(m.winner_id)}</span>}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {m.match_date || "TBD"} {m.start_time || ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedMatch({ ...m, mode: "result" }); setResultForm({}); }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                    >Result</button>
                    <button
                      onClick={() => { setSelectedMatch({ ...m, mode: "schedule" }); setSchedForm({
                        match_date: m.match_date ?? "",
                        start_time: m.start_time ? m.start_time.slice(0,5) : "",
                        end_time:   m.end_time   ? m.end_time.slice(0,5)   : "",
                        ground:     m.ground     ?? "",
                        match_type: m.match_type ?? "",
                        reason:     "",
                      }); }}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                    >Schedule</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Result Modal */}
      {selectedMatch?.mode === "result" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Enter Match Result</h3>
            {[["team1_score","Team 1 Score"],["team2_score","Team 2 Score"],
              ["team1_wickets","Team 1 Wickets"],["team2_wickets","Team 2 Wickets"],
              ["team1_overs","Team 1 Overs"],["team2_overs","Team 2 Overs"]].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-gray-400">{label}</label>
                <input type="number" className="w-full bg-gray-700 text-white rounded px-3 py-2 mt-1"
                  value={resultForm[k] || ""} onChange={e => setResultForm((p: any) => ({ ...p, [k]: +e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400">Winner</label>
              <select className="w-full bg-gray-700 text-white rounded px-3 py-2 mt-1"
                value={resultForm.winner_id || ""}
                onChange={e => setResultForm((p: any) => ({ ...p, winner_id: e.target.value }))}>
                <option value="">— Select winner —</option>
                {selectedMatch?.team1_id && (
                  <option value={selectedMatch.team1_id}>{tName(selectedMatch.team1_id)}</option>
                )}
                {selectedMatch?.team2_id && (
                  <option value={selectedMatch.team2_id}>{tName(selectedMatch.team2_id)}</option>
                )}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={saveResult} className="flex-1 bg-emerald-600 text-white rounded py-2 font-semibold">Save</button>
              <button onClick={() => setSelectedMatch(null)} className="flex-1 bg-gray-600 text-white rounded py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {selectedMatch?.mode === "schedule" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">📅 Update Schedule</h3>
            <p className="text-xs text-gray-400">
              {tShort(selectedMatch.team1_id)} vs {tShort(selectedMatch.team2_id)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date</label>
                <input type="date" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                  value={schedForm.match_date || ""}
                  onChange={e => setSchedForm((p: any) => ({ ...p, match_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Time</label>
                <input type="time" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                  value={schedForm.start_time || ""}
                  onChange={e => setSchedForm((p: any) => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">End Time</label>
                <input type="time" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                  value={schedForm.end_time || ""}
                  onChange={e => setSchedForm((p: any) => ({ ...p, end_time: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Ground / Venue</label>
                <input type="text" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                  value={schedForm.ground || ""}
                  onChange={e => setSchedForm((p: any) => ({ ...p, ground: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Match Type</label>
              <select className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                value={schedForm.match_type || ""}
                onChange={e => setSchedForm((p: any) => ({ ...p, match_type: e.target.value }))}>
                <option value="">— Select —</option>
                <option value="day">☀️ Day (Red Ball)</option>
                <option value="floodlight">🌙 Floodlight (White Ball)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reason (optional)</label>
              <input type="text" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Rescheduled due to rain"
                value={schedForm.reason || ""} onChange={e => setSchedForm((p: any) => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={saveSchedule} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 font-semibold text-sm">💾 Save</button>
              <button onClick={() => setSelectedMatch(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
