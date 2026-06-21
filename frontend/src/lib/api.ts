/**
 * Shared API client — wraps fetch with JWT auth, auto-refresh, and error handling.
 * All frontend modules import from here instead of calling fetch directly.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

// ── Token helpers ──────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem("bni_access_token");
export const getRefreshToken = () => localStorage.getItem("bni_refresh_token");

function saveTokens(access: string, refresh: string, role: string) {
  localStorage.setItem("bni_access_token",  access);
  localStorage.setItem("bni_refresh_token", refresh);
  localStorage.setItem("bni_role",          role);
}

function clearTokens() {
  localStorage.removeItem("bni_access_token");
  localStorage.removeItem("bni_refresh_token");
  localStorage.removeItem("bni_role");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Token refresh ──────────────────────────────────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) { clearTokens(); return false; }
      const d = await res.json();
      saveTokens(d.access_token, d.refresh_token, d.role);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// ── Main fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  if (!BASE) throw new Error("VITE_API_BASE_URL is not set");

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !_retried) {
    const ok = await tryRefresh();
    if (ok) return apiFetch<T>(path, options, true);
    clearTokens();
    window.dispatchEvent(new Event("bni-auth-expired"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json() as { message?: string; detail?: string };
      msg = body.message ?? body.detail ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ── Auth convenience ───────────────────────────────────────────────────────
export async function apiLogin(username: string, password: string): Promise<{ role: string }> {
  const d = await apiFetch<{ access_token: string; refresh_token: string; role: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
  );
  saveTokens(d.access_token, d.refresh_token, d.role);
  return { role: d.role };
}

export async function apiLogout(): Promise<void> {
  const rt = getRefreshToken();
  if (rt) {
    await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: rt }) })
      .catch(() => { /* best-effort */ });
  }
  clearTokens();
}
