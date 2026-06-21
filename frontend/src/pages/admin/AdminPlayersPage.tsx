import { useEffect, useState } from "react";
import {
  Edit3, Trash2, Save, X, Users, Download, Loader2, Eye, UserCircle2,
} from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import type { RegisteredPlayer } from "@/lib/registeredPlayersStorage";

// ── Photo preview modal ────────────────────────────────────────────────────
const PhotoModal = ({
  player,
  onClose,
}: {
  player: RegisteredPlayer;
  onClose: () => void;
}) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "var(--background)", borderRadius: 16,
        padding: 24, maxWidth: 420, width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        border: "1px solid var(--surface-dim)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase" }}>
            {player.name}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{player.teamName}</p>
        </div>
        <button className="admin-btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Photo */}
      <div style={{ borderRadius: 12, overflow: "hidden", background: "var(--surface-dim)", marginBottom: 16, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {player.photoDataUrl ? (
          <img
            src={player.photoDataUrl}
            alt={player.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <UserCircle2 size={80} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
        )}
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
        {[
          ["Phone",        player.phone],
          ["Business",     player.business],
          ["Category",     player.category],
          ["Role",         player.role],
          ["Team",         player.teamName],
          ["Jersey #",     player.jerseyNumber || "—"],
          ["Jersey Size",  player.jerseySize   || "—"],
          ["Track Pant",   player.trackPantSize || "—"],
          ["Membership",   player.membershipYears ? `${player.membershipYears} yr${player.membershipYears > 1 ? "s" : ""}` : "—"],
          ["Registered",   new Date(player.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
        ].map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────
const AdminPlayersPage = () => {
  const { players, loading, error, removePlayer, editPlayer, exportCSV, refresh } = usePlayers();
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<Partial<RegisteredPlayer>>({});
  const [searchTerm,  setSearchTerm]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [previewPlayer, setPreviewPlayer] = useState<RegisteredPlayer | null>(null);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => { void refresh(searchTerm || undefined); }, 400);
    return () => clearTimeout(id);
  }, [searchTerm, refresh]);

  const startEdit = (p: RegisteredPlayer) => { setEditingId(p.id); setEditForm({ ...p }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await editPlayer(editForm as RegisteredPlayer);
      cancelEdit();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (p: RegisteredPlayer) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await removePlayer(p.id);
      if (editingId === p.id) cancelEdit();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const SIZES = ["", "S", "M", "L", "XL", "XXL"];
  const ROLES = ["Player", "Batsman", "Bowler", "All Rounder", "Wicket Keeper"];

  return (
    <div>
      {/* Photo modal */}
      {previewPlayer && (
        <PhotoModal player={previewPlayer} onClose={() => setPreviewPlayer(null)} />
      )}

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>
          Management
        </span>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 28 }}>
        Registered Players
      </h1>

      <div className="admin-table-wrap">
        {/* Header bar */}
        <div className="admin-table-header">
          <h2 className="admin-table-title">All Players ({players.length})</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="admin-form-input"
              placeholder="Search name or team…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ minHeight: 38, width: 220, fontSize: 13 }}
            />
            <button className="admin-btn-secondary" onClick={() => void exportCSV()}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: "12px 20px", background: "rgba(220,38,38,0.08)", borderBottom: "1px solid rgba(220,38,38,0.2)" }}>
            <p style={{ color: "var(--ipl-red)", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>⚠ {error}</p>
            <button className="admin-btn-secondary" style={{ fontSize: 12, padding: "4px 12px" }} onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="admin-empty-state">
            <Loader2 size={28} className="spin" />
            <p className="admin-empty-title">Loading players…</p>
          </div>
        ) : players.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><Users size={28} /></div>
            <p className="admin-empty-title">{searchTerm ? "No matches" : "No players yet"}</p>
            <p className="admin-empty-desc">{searchTerm ? "Try different keywords." : "Players appear here after registration."}</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>Photo</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Team</th>
                  <th>Role</th>
                  <th>Jersey #</th>
                  <th>Jersey Size</th>
                  <th>Track Pant</th>
                  <th>Membership</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player =>
                  editingId === player.id ? (
                    /* ── Edit row ── */
                    <tr key={player.id} style={{ background: "rgba(var(--primary-light-rgb),0.06)" }}>
                      {/* Photo — not editable inline */}
                      <td>
                        <div
                          onClick={() => setPreviewPlayer(player)}
                          style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", cursor: "pointer", background: "var(--surface-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {player.photoDataUrl
                            ? <img src={player.photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <UserCircle2 size={20} style={{ color: "var(--text-secondary)" }} />
                          }
                        </div>
                      </td>
                      <td>
                        <input className="admin-edit-input" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: 130 }} />
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{player.phone}</td>
                      <td>
                        <input className="admin-edit-input" value={editForm.business || ""} onChange={e => setEditForm({ ...editForm, business: e.target.value })} style={{ width: 120 }} />
                      </td>
                      <td>
                        <input className="admin-edit-input" value={editForm.category || ""} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ width: 100 }} />
                      </td>
                      <td>
                        <input className="admin-edit-input" value={editForm.teamName || ""} onChange={e => setEditForm({ ...editForm, teamName: e.target.value })} style={{ width: 120 }} />
                      </td>
                      <td>
                        <select className="admin-edit-input" value={editForm.role || ""} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ width: 120 }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <input className="admin-edit-input" value={editForm.jerseyNumber || ""} onChange={e => setEditForm({ ...editForm, jerseyNumber: e.target.value.replace(/\D/g, "") })} style={{ width: 56 }} />
                      </td>
                      <td>
                        <select className="admin-edit-input" value={editForm.jerseySize || ""} onChange={e => setEditForm({ ...editForm, jerseySize: e.target.value })} style={{ width: 70 }}>
                          {SIZES.map(s => <option key={s} value={s}>{s || "—"}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="admin-edit-input" value={editForm.trackPantSize || ""} onChange={e => setEditForm({ ...editForm, trackPantSize: e.target.value })} style={{ width: 70 }}>
                          {SIZES.map(s => <option key={s} value={s}>{s || "—"}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {player.membershipYears ? `${player.membershipYears} yr` : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {new Date(player.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button className="admin-btn-icon" onClick={() => void saveEdit()} disabled={saving} title="Save">
                            {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                          </button>
                          <button className="admin-btn-icon" onClick={cancelEdit} title="Cancel"><X size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    /* ── View row ── */
                    <tr key={player.id}>
                      {/* Photo thumbnail */}
                      <td>
                        <div
                          onClick={() => setPreviewPlayer(player)}
                          title="View profile"
                          style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", cursor: "pointer", background: "var(--surface-dim)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--primary)", flexShrink: 0 }}
                        >
                          {player.photoDataUrl ? (
                            <img src={player.photoDataUrl} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <UserCircle2 size={20} style={{ color: "var(--text-secondary)" }} />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{player.name}</td>
                      <td style={{ fontSize: 12 }}>{player.phone}</td>
                      <td style={{ fontSize: 12 }}>{player.business || "—"}</td>
                      <td style={{ fontSize: 12 }}>{player.category || "—"}</td>
                      <td style={{ fontSize: 12 }}>{player.teamName}</td>
                      <td style={{ fontSize: 12 }}>{player.role}</td>
                      <td style={{ fontSize: 12 }}>{player.jerseyNumber || "—"}</td>
                      <td style={{ fontSize: 12 }}>{player.jerseySize   || "—"}</td>
                      <td style={{ fontSize: 12 }}>{player.trackPantSize || "—"}</td>
                      <td style={{ fontSize: 12 }}>
                        {player.membershipYears ? `${player.membershipYears} yr${player.membershipYears > 1 ? "s" : ""}` : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {new Date(player.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button className="admin-btn-icon" onClick={() => setPreviewPlayer(player)} title="View profile">
                            <Eye size={14} />
                          </button>
                          <button className="admin-btn-icon" onClick={() => startEdit(player)} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button className="admin-btn-icon danger" onClick={() => void confirmDelete(player)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlayersPage;
