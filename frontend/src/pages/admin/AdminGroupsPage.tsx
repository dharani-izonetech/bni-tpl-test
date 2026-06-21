/**
 * Groups Admin Page
 *
 * Features:
 * - List all groups with their assigned teams
 * - Create a new group (name + slug auto-generated)
 * - Delete a group
 * - Add a team to a group (dropdown filtered to unassigned teams)
 * - Remove a team from a group
 *
 * Backend endpoints:
 *   GET    /groups
 *   POST   /groups                         { name, slug, team_ids:[] }
 *   DELETE /groups/{group_id}
 *   POST   /groups/{group_id}/teams/{team_id}
 *   DELETE /groups/{group_id}/teams/{team_id}
 *   GET    /teams
 */
import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../api/client";
import { Users, Plus, Trash2, UserPlus, X, RefreshCw } from "lucide-react";

// ─── types ──────────────────────────────────────────────────────────────────

interface Team  { id: string; name: string; short: string; logo_url?: string | null }
interface Group { id: string; name: string; slug: string; teams: Team[] }

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Create Group Modal ──────────────────────────────────────────────────────

function CreateGroupModal({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName]   = useState("");
  const [slug, setSlug]   = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState("");

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(slugify(v));
  };

  const handleSave = async () => {
    if (!name.trim()) { setErr("Group name is required."); return; }
    if (!slug.trim()) { setErr("Slug is required."); return; }
    setSaving(true); setErr("");
    try {
      await apiClient.post("/groups", { name: name.trim(), slug: slug.trim(), team_ids: [] });
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to create group.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2330] rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="font-bold text-white">Create New Group</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Group Name *</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Group A"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Slug *</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="e.g. group-a"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none placeholder-gray-600 font-mono"
            />
            <p className="text-[10px] text-gray-600 mt-1">Auto-generated from name. Used in URLs.</p>
          </div>
          {err && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm">
            {saving ? "Creating…" : "✓ Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Team Modal ──────────────────────────────────────────────────────────

function AddTeamModal({
  group,
  allTeams,
  onAdded,
  onClose,
}: {
  group: Group;
  allTeams: Team[];
  onAdded: () => void;
  onClose: () => void;
}) {
  const assignedIds = new Set(group.teams.map(t => t.id));
  const available   = allTeams.filter(t => !assignedIds.has(t.id));

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSave = async () => {
    if (selected.length === 0) { setErr("Select at least one team."); return; }
    setSaving(true); setErr("");
    try {
      await Promise.all(
        selected.map(tid =>
          apiClient.post(`/groups/${group.id}/teams/${tid}`)
        )
      );
      onAdded();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to add team(s).");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2330] rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h3 className="font-bold text-white">Add Teams</h3>
            <p className="text-xs text-gray-400 mt-0.5">to {group.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="px-6 py-4">
          {available.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">All teams are already assigned to this group.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {available.map(t => (
                <label key={t.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${
                    selected.includes(t.id)
                      ? "bg-emerald-900/30 border-emerald-700/50"
                      : "bg-gray-800/50 border-gray-700/40 hover:bg-gray-700/40"
                  }`}>
                  <input type="checkbox" checked={selected.includes(t.id)}
                    onChange={() => toggle(t.id)}
                    className="w-4 h-4 accent-emerald-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.short}</div>
                  </div>
                  {selected.includes(t.id) && (
                    <span className="text-emerald-400 text-xs font-bold shrink-0">✓</span>
                  )}
                </label>
              ))}
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-3 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{err}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || selected.length === 0}
            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm">
            {saving ? "Adding…" : `Add ${selected.length > 0 ? `${selected.length} ` : ""}Team${selected.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Card ──────────────────────────────────────────────────────────────

function GroupCard({
  group,
  allTeams,
  onRefresh,
  onDelete,
  showToast,
}: {
  group: Group;
  allTeams: Team[];
  onRefresh: () => void;
  onDelete: (g: Group) => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [addOpen,   setAddOpen]   = useState(false);
  const [removing,  setRemoving]  = useState<string | null>(null);

  const handleRemoveTeam = async (teamId: string) => {
    setRemoving(teamId);
    try {
      await apiClient.delete(`/groups/${group.id}/teams/${teamId}`);
      showToast("Team removed from group.");
      onRefresh();
    } catch (e: any) {
      showToast(e?.response?.data?.detail ?? "Failed to remove team.", false);
    } finally { setRemoving(null); }
  };

  return (
    <>
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#21283a] border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-amber-400">{group.name}</span>
            <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded">{group.slug}</span>
            <span className="text-xs text-gray-500">
              <span className="text-white font-semibold">{group.teams.length}</span> teams
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <UserPlus size={13}/> Add Team
            </button>
            <button
              onClick={() => onDelete(group)}
              className="flex items-center gap-1.5 text-xs bg-red-900/50 hover:bg-red-800/60 border border-red-800/40 text-red-300 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <Trash2 size={13}/> Delete Group
            </button>
          </div>
        </div>

        {/* Teams list */}
        <div className="p-4">
          {group.teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-gray-700 rounded-xl text-center">
              <Users size={24} className="text-gray-600 mb-2"/>
              <p className="text-sm text-gray-500">No teams assigned yet.</p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                Add teams →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.teams.map(team => (
                <div key={team.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-800/50 border border-gray-700/40 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Logo or initials */}
                    <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.short} className="w-full h-full object-contain"/>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-300">{team.short.slice(0,3)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                      <p className="text-[10px] text-gray-500">{team.short}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTeam(team.id)}
                    disabled={removing === team.id}
                    className="shrink-0 ml-2 text-gray-600 hover:text-red-400 disabled:opacity-40 transition-colors p-1 rounded"
                    title="Remove from group"
                  >
                    {removing === team.id
                      ? <span className="text-[10px] text-gray-500">…</span>
                      : <X size={14}/>
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <AddTeamModal
          group={group}
          allTeams={allTeams}
          onAdded={onRefresh}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminGroupsPage() {
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState<{ text: string; ok: boolean } | null>(null);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, teamRes] = await Promise.all([
        apiClient.get<any>("/groups"),
        apiClient.get<any>("/teams"),
      ]);
      const grps: Group[]  = Array.isArray(grpRes.data)  ? grpRes.data  : grpRes.data?.data  ?? [];
      const tms:  Team[]   = Array.isArray(teamRes.data) ? teamRes.data : teamRes.data?.data ?? [];
      setGroups(grps);
      setAllTeams(tms);
    } catch (e: any) {
      showToast("Failed to load: " + (e?.message ?? "Unknown"), false);
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/groups/${deleteTarget.id}`);
      showToast(`✅ "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadAll();
    } catch (e: any) {
      showToast("❌ " + (e?.response?.data?.detail ?? e?.message ?? "Failed to delete."), false);
    } finally { setDeleting(false); }
  };

  // Teams not in any group yet
  const assignedTeamIds = new Set(groups.flatMap(g => g.teams.map(t => t.id)));
  const unassignedTeams = allTeams.filter(t => !assignedTeamIds.has(t.id));

  return (
    <div className="min-h-screen bg-[#111520] text-white">
      <div className="max-w-5xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Users size={22} className="text-amber-400"/> Groups
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Create groups, assign teams. Groups feed into the League Stage points table.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} disabled={loading}
              className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
              Refresh
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
              <Plus size={14}/> New Group
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Groups",           value: groups.length,           color: "text-amber-400"   },
              { label: "Teams Assigned",   value: assignedTeamIds.size,    color: "text-emerald-400" },
              { label: "Teams Unassigned", value: unassignedTeams.length,  color: "text-red-400"     },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1f2e] border border-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Unassigned teams warning */}
        {!loading && unassignedTeams.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/40 text-amber-300 rounded-xl px-5 py-3.5 text-sm">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-semibold">
                {unassignedTeams.length} team{unassignedTeams.length > 1 ? "s" : ""} not assigned to any group:
              </p>
              <p className="text-xs text-amber-400/70 mt-1">
                {unassignedTeams.map(t => t.short).join(", ")}
              </p>
            </div>
          </div>
        )}

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
            <span>Loading groups…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-24 bg-[#1a1f2e] rounded-2xl border border-gray-700/50">
            <Users size={48} className="text-gray-600 mx-auto mb-4"/>
            <p className="text-lg font-bold text-white">No groups yet</p>
            <p className="text-sm text-gray-400 mt-2">Create your first group to get started.</p>
            <button onClick={() => setCreateOpen(true)}
              className="mt-5 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm mx-auto transition-colors">
              <Plus size={15}/> Create First Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                allTeams={allTeams}
                onRefresh={loadAll}
                onDelete={setDeleteTarget}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {createOpen && (
        <CreateGroupModal
          onCreated={loadAll}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2330] rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-lg font-bold text-white">Delete "{deleteTarget.name}"?</h3>
              <p className="text-sm text-gray-400 mt-2">
                This will remove the group and all its team assignments.
                Points table entries for this group will remain.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteGroup} disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
