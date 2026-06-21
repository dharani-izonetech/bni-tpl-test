import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tournamentStagesApi } from "../../../api/tournamentStages";
import { scheduleMatchesApi } from "../../../api/services";

// IST helpers — match_date is stored tz-aware (+05:30)
function istParts(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(d)) p[part.type] = part.value;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
function formatIST(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function ScheduleManagementPage() {
  const [startDate, setStartDate] = useState("");
  const [preferFL, setPreferFL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const generate = async () => {
    if (!startDate) { setMsg("❌ Please select a start date."); return; }
    setLoading(true); setMsg("");
    try {
      await tournamentStagesApi.generateSchedule({ start_date: startDate, prefer_floodlight: preferFL });
      setMsg("✅ Schedule generated! All matches have been assigned dates and time slots.");
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.detail || "Failed to generate schedule"));
    } finally { setLoading(false); }
  };

  const slots = [
    { label: "Day Slots (Red Ball)", icon: "☀️", time: "08:00 – 18:00", count: 10 },
    { label: "Floodlight Slots (White Ball)", icon: "🌙", time: "18:00 – 23:00", count: 5 },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-black">Schedule Management</h1>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Super 12 Matches", value: "12", sub: "6 overs · 60 min" },
          { label: "Quarter Finals", value: "4", sub: "8 overs · 90 min" },
          { label: "Semi Finals", value: "2", sub: "8 overs · 90 min" },
          { label: "Final", value: "1", sub: "8 overs · 90 min" },
        ].map(c => (
          <div key={c.label} className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{c.value}</p>
            <p className="text-sm font-semibold text-white mt-1">{c.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Slot info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-4">
            <p className="font-semibold text-white">{s.icon} {s.label}</p>
            <p className="text-sm text-gray-400 mt-1">{s.time}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.count} slots available per day</p>
          </div>
        ))}
      </div>

      {/* Generate form */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-5 max-w-lg">
        <h2 className="text-lg font-bold text-white">Auto-Generate Schedule</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tournament Start Date</label>
          <input type="date" className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 border border-gray-600 focus:outline-none focus:border-amber-500"
            value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded accent-amber-500"
            checked={preferFL} onChange={e => setPreferFL(e.target.checked)} />
          <span className="text-sm text-gray-300">Prefer Floodlight (evening) slots</span>
        </label>
        <button onClick={generate} disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Generating…" : "⚡ Generate Full Schedule"}
        </button>
        <p className="text-xs text-gray-500">
          System will auto-assign dates, time slots, ball type, and prevent same-team double-booking.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg font-medium ${msg.startsWith("✅") ? "bg-emerald-900 text-emerald-200" : "bg-red-900 text-red-200"}`}>
          {msg}
        </div>
      )}

      {/* ── Manual date/time editor for all matches ── */}
      <AllMatchesEditor />
    </div>
  );
}

function AllMatchesEditor() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-all-matches"],
    queryFn: () => scheduleMatchesApi.adminAll(),
  });

  const update = useMutation({
    mutationFn: ({ id, match_date }: { id: string; match_date: string }) =>
      scheduleMatchesApi.update(id, { match_date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-matches"] });
      toast.success("Match date/time updated");
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed to update match"),
  });

  const matches = (data?.data ?? []).slice().sort((a: any, b: any) => {
    const da = a.match_date ? new Date(a.match_date).getTime() : Infinity;
    const db = b.match_date ? new Date(b.match_date).getTime() : Infinity;
    return da - db || (a.match_number ?? 0) - (b.match_number ?? 0);
  });

  function startEdit(m: any) {
    const { date, time } = istParts(m.match_date);
    setEditingId(m.id);
    setEditDate(date);
    setEditTime(time);
  }

  function save(id: string) {
    if (!editDate || !editTime) { toast.error("Pick both a date and a time"); return; }
    // Build an IST (+05:30) timestamp so it stores the intended local time
    update.mutate({ id, match_date: `${editDate}T${editTime}:00+05:30` });
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">All Matches — Manual Date / Time</h2>
        <span className="text-xs text-gray-400">{matches.length} matches</span>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Edit any match's date and time directly. Times are saved in IST.
      </p>

      {isLoading ? (
        <p className="text-gray-400 text-sm py-6 text-center">Loading matches…</p>
      ) : isError ? (
        <p className="text-red-300 text-sm py-6 text-center">Failed to load matches.</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-400 text-sm py-6 text-center">No matches yet. Seed or generate the schedule first.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-700">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Match</th>
                <th className="px-3 py-2">Date &amp; Time (IST)</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {matches.map((m: any) => {
                const t1 = m.team1?.name ?? "TBD";
                const t2 = m.team2?.name ?? "TBD";
                const isEditing = editingId === m.id;
                return (
                  <tr key={m.id} className="text-gray-200">
                    <td className="px-3 py-2 text-gray-500">{m.match_number ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">{t1} <span className="text-gray-500">vs</span> {t2}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                            className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-amber-500" />
                          <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                            className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-amber-500" />
                        </div>
                      ) : (
                        <span className={m.match_date ? "text-gray-100" : "text-gray-500"}>{formatIST(m.match_date)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs rounded px-2 py-0.5 bg-gray-700 text-gray-300">{m.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => save(m.id)} disabled={update.isPending}
                            className="rounded bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1 text-xs disabled:opacity-50">
                            {update.isPending ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(m)}
                          className="rounded border border-gray-600 hover:bg-gray-700 text-gray-200 px-3 py-1 text-xs">✏️ Edit</button>
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
