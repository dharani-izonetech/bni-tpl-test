/**
 * Registered players storage — replaced with live API calls.
 * Keeps original type names and function signatures so all consumers compile unchanged.
 */
import { apiFetch, getAuthHeaders } from "@/lib/api";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const REGISTERED_PLAYERS_EVENT = "bni-registered-players-updated";

// ── Types (compatible with originals) ─────────────────────────────────────
export type RegisteredPlayer = {
  id: string;
  name: string;
  teamShort: string;
  teamName: string;
  role: string;
  business: string;
  category: string;
  phone: string;
  photoDataUrl: string;   // contains photo_url from backend (full URL)
  membershipYears?: number;
  jerseyNumber: string;
  jerseySize: string;
  trackPantSize: string;
  registeredAt: string;
};

type NewRegisteredPlayer = Omit<RegisteredPlayer, "id" | "registeredAt">;

// ── Team short map (unchanged) ─────────────────────────────────────────────
const TEAM_SHORT_BY_NAME: Record<string, string> = {
  "bni azpire": "AZP",      azpire: "AZP",
  "bni benchmark": "BMK",   benchmark: "BMK",
  "bni champions": "CHP",   champions: "CHP",
  "bni dynamic": "DYN",     dynamic: "DYN",
  "bni emperor": "EMP",     emperor: "EMP",
  "bni fortune": "FOR",     fortune: "FOR",
  "bni gladiators": "GLD",  gladiators: "GLD",
  "bni harmony": "HMY",     harmony: "HMY",
  "bni icons": "ICN",       icons: "ICN",
  "bni jaaguar": "JAG",     jaaguar: "JAG",
  "bni kings": "KNG",       kings: "KNG",
  "bni legends": "LGD",     legends: "LGD",
  "bni millionaire": "MLN", millionaire: "MLN",
  "bni nest": "NST",        nest: "NST",
  "bni prince": "PRC",      prince: "PRC",
  "bni spark": "SPK",       spark: "SPK",
  "bni royals": "ROY",      royals: "ROY",
  "bni warriors": "WAR",    warriors: "WAR",
  "bni oscar": "OSC",       oscar: "OSC",
  "bni victory": "VTY",      victory: "VTY",
};

const normalizeTeamName = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

export const getTeamShortFromTeamName = (teamName: string): string | null => {
  if (!teamName.trim()) return null;
  return TEAM_SHORT_BY_NAME[normalizeTeamName(teamName)] ?? null;
};

// ── Adapter ────────────────────────────────────────────────────────────────
function adapt(raw: Record<string, unknown>): RegisteredPlayer {
  return {
    id:             String(raw.id ?? ""),
    name:           String(raw.name ?? ""),
    teamShort:      String(raw.team_short ?? ""),
    teamName:       String(raw.team_name ?? ""),
    role:           String(raw.role ?? "Player"),
    business:       String(raw.business ?? ""),
    category:       String(raw.category ?? ""),
    phone:          String(raw.phone_no ?? ""),
    photoDataUrl:   String(raw.photo_data ?? ""),
    membershipYears: raw.membership_years != null ? Number(raw.membership_years) : undefined,
    jerseyNumber:   String(raw.jersey_number ?? ""),
    jerseySize:     String(raw.jersey_size ?? ""),
    trackPantSize:  String(raw.track_pant_size ?? ""),
    registeredAt:   String(raw.registered_at ?? new Date().toISOString()),
  };
}

// ── Cache ──────────────────────────────────────────────────────────────────
let _cache: RegisteredPlayer[] | null = null;

// ── Public API ─────────────────────────────────────────────────────────────
export const loadRegisteredPlayers = (): RegisteredPlayer[] => _cache ?? [];

/** Public — uses /players/squad (no auth required, no sensitive fields) */
export const loadRegisteredPlayersAsync = async (search?: string): Promise<RegisteredPlayer[]> => {
  const q = search ? `?team=${encodeURIComponent(search)}` : "";
  const res = await apiFetch<{ data: unknown[] }>(`/players/squad${q}`);
  _cache = (res.data ?? []).map(r => adapt(r as Record<string, unknown>));
  window.dispatchEvent(new Event(REGISTERED_PLAYERS_EVENT));
  return _cache;
};

/** Admin — uses /players (requires auth, returns all fields) */
export const loadRegisteredPlayersAdminAsync = async (search?: string): Promise<RegisteredPlayer[]> => {
  const q = search ? `?search=${encodeURIComponent(search)}&page_size=500` : "?page_size=500";
  const res = await apiFetch<{ data: unknown[]; meta?: { total: number } }>(`/players${q}`);
  _cache = (res.data ?? []).map(r => adapt(r as Record<string, unknown>));
  window.dispatchEvent(new Event(REGISTERED_PLAYERS_EVENT));
  return _cache;
};

/** Used by RegisterPage — saves locally first (for instant feedback), then syncs via API. */
export const saveRegisteredPlayer = (_player: NewRegisteredPlayer): RegisteredPlayer | null => {
  // The actual API call is handled by RegisterPage via createUser().
  // This stub keeps the return contract but does nothing (no localStorage).
  // Returns a temporary object so the success screen shows immediately.
  const temp: RegisteredPlayer = {
    ..._player,
    id: crypto.randomUUID(),
    registeredAt: new Date().toISOString(),
    photoDataUrl: _player.photoDataUrl ?? "",
  };
  _cache = [temp, ...(_cache ?? [])];
  window.dispatchEvent(new Event(REGISTERED_PLAYERS_EVENT));
  return temp;
};

export const deleteRegisteredPlayer = async (id: string): Promise<void> => {
  await apiFetch(`/players/${id}`, { method: "DELETE" });
  _cache = (_cache ?? []).filter(p => p.id !== id);
  window.dispatchEvent(new Event(REGISTERED_PLAYERS_EVENT));
};

export const updateRegisteredPlayer = async (updated: RegisteredPlayer): Promise<void> => {
  const body = {
    name:           updated.name,
    role:           updated.role,
    jersey_number:  updated.jerseyNumber,
    jersey_size:    updated.jerseySize,
    track_pant_size: updated.trackPantSize,
    team_name:      updated.teamName,
  };
  await apiFetch(`/players/${updated.id}`, { method: "PUT", body: JSON.stringify(body) });
  _cache = (_cache ?? []).map(p => p.id === updated.id ? updated : p);
  window.dispatchEvent(new Event(REGISTERED_PLAYERS_EVENT));
};

export const subscribeToRegisteredPlayers = (callback: () => void) => {
  window.addEventListener(REGISTERED_PLAYERS_EVENT, callback);
  return () => window.removeEventListener(REGISTERED_PLAYERS_EVENT, callback);
};

// ── CSV export via backend ─────────────────────────────────────────────────
export const exportPlayersCSV = async (): Promise<void> => {
  const res = await fetch(`${BASE}/players/export/csv`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `players_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
