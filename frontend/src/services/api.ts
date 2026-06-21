/**
 * Player registration API — sends form data to backend /players endpoint.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export async function createUser(payload: FormData): Promise<unknown> {
  if (!BASE) throw new Error("API base URL is not configured. Please contact support.");

  const response = await fetch(`${BASE}/players`, {
    method: "POST",
    body: payload, // multipart/form-data — do NOT set Content-Type header
  });

  if (!response.ok) {
    let errorMessage = "Unable to register player.";
    try {
      const data = (await response.json()) as { message?: string; detail?: string };
      errorMessage = data.message ?? data.detail ?? errorMessage;
    } catch { /* keep fallback */ }
    throw new Error(errorMessage);
  }

  return response.json().catch(() => ({}));
}
