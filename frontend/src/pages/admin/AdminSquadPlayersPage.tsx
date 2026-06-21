/**
 * AdminSquadPlayersPage — CricPro squad player CRUD.
 * Manages PlayerProfile entities used in live scoring (captain, VC, roles, etc.)
 */
import { useEffect, useState, useCallback } from "react"
import { Plus, Edit3, Trash2, Save, X, Users, Loader2, Search, RefreshCw, Shield, Star } from "lucide-react"
import { apiFetch } from "@/lib/api"

// ── Types ──────────────────────────────────────────────────────────────────

type PlayerProfile = {
  id: number
  user_id: string
  full_name: string
  username: string | null
  team: string | null
  team_id: string | null
  player_role: string | null
  batting_style: string | null
  bowling_style: string | null
  jersey_number: number | null
  is_captain: boolean
  is_vice_captain: boolean
  is_wicket_keeper: boolean
  is_active: boolean
}

type Team = { id: string; name: string; short: string | null }
type UserOption = { id: string; full_name: string | null; username: string; email: string }

const PLAYER_ROLES = ["Batsman", "Bowler", "All Rounder", "Wicket Keeper"]
const BATTING_STYLES = ["Right Hand", "Left Hand"]
const BOWLING_STYLES = [
  "Right Arm Fast", "Right Arm Medium", "Right Arm Spin",
  "Left Arm Fast", "Left Arm Medium", "Left Arm Spin",
]

const BLANK_FORM = {
  user_id: "",
  team_id: "",
  player_role: "",
  batting_style: "",
  bowling_style: "",
  jersey_number: "" as string | number,
  is_captain: false,
  is_vice_captain: false,
  is_wicket_keeper: false,
  is_active: true,
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminSquadPlayersPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [teams, setTeams]     = useState<Team[]>([])
  const [users, setUsers]     = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  // Filters
  const [search, setSearch]     = useState("")
  const [filterTeam, setFilterTeam] = useState("")

  // Form state
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<number | null>(null)
  const [form, setForm]           = useState({ ...BLANK_FORM })
  const [formError, setFormError] = useState<string | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (filterTeam) params.set("team_id", filterTeam)
      if (search.trim()) params.set("search", search.trim())
      const qs = params.toString()

      const [playersRes, teamsRes] = await Promise.all([
        apiFetch<PlayerProfile[]>(`/cricpro/players${qs ? `?${qs}` : ""}`),
        apiFetch<Team[]>("/cricpro/teams"),
      ])
      setPlayers(playersRes)
      setTeams(teamsRes)
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false) }
  }, [filterTeam, search])

  const loadUsers = async (s?: string) => {
    try {
      const res = await apiFetch<UserOption[]>(`/cricpro/users${s ? `?search=${encodeURIComponent(s)}` : ""}`)
      setUsers(Array.isArray(res) ? res : [])
    } catch { setUsers([]) }
  }

  // Debounce search — wait 400ms after last keystroke
  useEffect(() => {
    const id = setTimeout(() => void load(), 400)
    return () => clearTimeout(id)
  }, [search, filterTeam, load])

  // Load teams and users on mount only
  useEffect(() => { void loadUsers() }, [])

  // ── Filtered view — just show all (server already filtered) ─────────────

  const filtered = players

  // ── Open form ────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditId(null)
    setForm({ ...BLANK_FORM })
    setFormError(null)
    setShowForm(true)
    void loadUsers()  // preload users list
  }

  const openEdit = (p: PlayerProfile) => {
    setEditId(p.id)
    setForm({
      user_id:         p.user_id,
      team_id:         p.team_id ?? "",
      player_role:     p.player_role ?? "",
      batting_style:   p.batting_style ?? "",
      bowling_style:   p.bowling_style ?? "",
      jersey_number:   p.jersey_number ?? "",
      is_captain:      p.is_captain,
      is_vice_captain: p.is_vice_captain,
      is_wicket_keeper: p.is_wicket_keeper,
      is_active:       p.is_active,
    })
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null) }

  const f = (key: keyof typeof form, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }))

  // ── Save ─────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!form.user_id && !editId) { setFormError("Please select a user."); return }
    setSaving(true); setFormError(null)
    try {
      const body: Record<string, unknown> = {
        player_role:      form.player_role     || null,
        batting_style:    form.batting_style   || null,
        bowling_style:    form.bowling_style   || null,
        jersey_number:    form.jersey_number !== "" ? Number(form.jersey_number) : null,
        team_id:          form.team_id         || null,
        is_captain:       form.is_captain,
        is_vice_captain:  form.is_vice_captain,
        is_wicket_keeper: form.is_wicket_keeper,
        is_active:        form.is_active,
      }
      if (!editId) body.user_id = form.user_id

      if (editId) {
        await apiFetch(`/cricpro/players/${editId}`, { method: "PATCH", body: JSON.stringify(body) })
      } else {
        await apiFetch("/cricpro/players", { method: "POST", body: JSON.stringify(body) })
      }
      closeForm()
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed")
    } finally { setSaving(false) }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const del = async (p: PlayerProfile) => {
    if (!window.confirm(`Remove ${p.full_name} from squad?`)) return
    try {
      const res = await apiFetch<{ message: string }>(`/cricpro/players/${p.id}`, { method: "DELETE" })
      window.alert(res.message)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed")
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>
          Management
        </span>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 28 }}>
        Squad Players
      </h1>

      {/* ── Player list ── */}
      <div className="admin-table-wrap" style={{ marginBottom: 32 }}>
        <div className="admin-table-header">
          <h2 className="admin-table-title">
            <Users size={18} style={{ display: "inline", marginRight: 8 }} />
            All Squad Players ({filtered.length})
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }} />
              <input
                className="admin-form-input"
                placeholder="Search player…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 30, width: 200, fontSize: 13 }}
              />
            </div>
            {/* Team filter */}
            <select className="admin-form-input" value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={{ width: 160, fontSize: 13 }}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button className="admin-btn-secondary" onClick={() => void load()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <RefreshCw size={13} />
            </button>
            <button className="admin-btn-primary" onClick={openNew}>
              <Plus size={15} /> Add Player
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state"><Loader2 size={28} className="spin" /><p className="admin-empty-title">Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><Users size={28} /></div>
            <p className="admin-empty-title">No players found</p>
            <p className="admin-empty-desc">Add players to the squad using the button above.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Team</th><th>Role</th>
                  <th>Batting</th><th>Bowling</th><th>Jersey</th>
                  <th>Flags</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {p.full_name}
                      {p.is_captain && <span title="Captain" style={{ marginLeft: 4, color: "#f57c00", fontSize: 11 }}>👑 C</span>}
                      {p.is_vice_captain && <span title="Vice Captain" style={{ marginLeft: 4, color: "#5c6bc0", fontSize: 11 }}>⭐ VC</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{p.team ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{p.player_role ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{p.batting_style ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{p.bowling_style ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{p.jersey_number ?? "—"}</td>
                    <td style={{ fontSize: 11 }}>
                      {p.is_wicket_keeper && <span style={{ background: "#e3f2fd", color: "#1565c0", borderRadius: 4, padding: "1px 5px", marginRight: 3 }}>WK</span>}
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: p.is_active ? "#2a7a2a" : "#555", color: "#fff",
                      }}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button className="admin-btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit3 size={14} /></button>
                        <button className="admin-btn-icon danger" onClick={() => void del(p)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit form ── */}
      {showForm && (
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <h2 className="admin-table-title">{editId ? "Edit Player" : "Add Player to Squad"}</h2>
            <button className="admin-btn-icon" onClick={closeForm}><X size={16} /></button>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

            {formError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", color: "var(--ipl-red)", fontSize: 13, fontWeight: 600 }}>
                ⚠ {formError}
              </div>
            )}

            {/* User (only for new) */}
            {!editId && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>User *</p>
                {/* User search input */}
                <input
                  className="admin-form-input"
                  placeholder="Type to search users by name or email…"
                  onChange={e => void loadUsers(e.target.value)}
                  style={{ marginBottom: 6, fontSize: 13 }}
                />
                <select
                  className="admin-form-input"
                  value={form.user_id}
                  onChange={e => f("user_id", e.target.value)}
                  size={5}
                  style={{ height: "auto" }}
                >
                  <option value="">— Select user —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name ?? u.username} ({u.email})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                  The user must already have an account. Search by name or email above.
                </p>
              </div>
            )}

            {/* Team + Jersey + Role */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>Team</p>
                <select className="admin-form-input" value={form.team_id} onChange={e => f("team_id", e.target.value)}>
                  <option value="">— No team —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>Jersey Number</p>
                <input className="admin-form-input" type="number" min={1} max={99} value={form.jersey_number} onChange={e => f("jersey_number", e.target.value)} placeholder="e.g. 7" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>Role</p>
                <select className="admin-form-input" value={form.player_role ?? ""} onChange={e => f("player_role", e.target.value)}>
                  <option value="">— Select —</option>
                  {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Batting + Bowling styles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>Batting Style</p>
                <select className="admin-form-input" value={form.batting_style ?? ""} onChange={e => f("batting_style", e.target.value)}>
                  <option value="">— Select —</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 6 }}>Bowling Style</p>
                <select className="admin-form-input" value={form.bowling_style ?? ""} onChange={e => f("bowling_style", e.target.value)}>
                  <option value="">— Select —</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Flags */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>Flags</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { key: "is_captain",       label: "👑 Captain",      icon: Shield },
                  { key: "is_vice_captain",  label: "⭐ Vice Captain", icon: Star  },
                  { key: "is_wicket_keeper", label: "🧤 Wicket Keeper", icon: null  },
                  { key: "is_active",        label: "✅ Active",        icon: null  },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={!!form[key as keyof typeof form]}
                      onChange={e => f(key as keyof typeof form, e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="admin-btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="admin-btn-primary" onClick={() => void save()} disabled={saving}>
                {saving ? <><Loader2 size={14} className="spin" style={{ marginRight: 6 }} />Saving…</> : <><Save size={14} style={{ marginRight: 6 }} />{editId ? "Update" : "Create"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
