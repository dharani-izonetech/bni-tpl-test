import React, { useState, useEffect } from "react";
import { tournamentStagesApi } from "../../../api/tournamentStages";

export default function AuditLogsPage() {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [schedLogs, setSchedLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<"overrides"|"schedule">("overrides");
  const [stageFilter, setStageFilter] = useState("");

  const load = async () => {
    try {
      const [o, s] = await Promise.all([
        tournamentStagesApi.getOverrideLogs(stageFilter || undefined),
        tournamentStagesApi.getScheduleLogs(stageFilter || undefined),
      ]);
      setOverrides(o.data?.data || []);
      setSchedLogs(s.data?.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [stageFilter]);

  const rows = tab === "overrides" ? overrides : schedLogs;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-black">Audit Logs</h1>

      <div className="flex gap-3 flex-wrap">
        {["overrides","schedule"].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? "bg-amber-500 text-black" : "bg-gray-700 text-gray-300"}`}>
            {t === "overrides" ? "Team Overrides" : "Schedule Changes"}
          </button>
        ))}
        <select className="bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm"
          value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="">All Stages</option>
          {["league","super12","quarterfinal","semifinal","final"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-700 text-gray-400">
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-left px-4 py-3">Action / Field</th>
              <th className="text-left px-4 py-3">Previous</th>
              <th className="text-left px-4 py-3">New Value</th>
              <th className="text-left px-4 py-3">Admin</th>
              <th className="text-left px-4 py-3">Reason</th>
              <th className="text-left px-4 py-3">Time</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">No logs found.</td></tr>
              ) : rows.map((r: any) => (
                <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-amber-400 capitalize">{r.stage}</td>
                  <td className="px-4 py-3 text-gray-200">{r.action || r.field_changed}</td>
                  <td className="px-4 py-3 text-red-300 text-xs max-w-[120px] truncate">{r.previous_value || "—"}</td>
                  <td className="px-4 py-3 text-emerald-300 text-xs max-w-[120px] truncate">{r.new_value || "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{r.admin_user || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.reason || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
