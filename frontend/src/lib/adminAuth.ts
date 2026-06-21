/**
 * Admin authentication — replaces mock localStorage auth with real JWT API calls.
 */
import { apiLogin, apiLogout, getAccessToken } from "@/lib/api";

const AUTH_EVENT = "bni-admin-auth-changed";

export const loginAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    await apiLogin(username, password);
    window.dispatchEvent(new Event(AUTH_EVENT));
    return true;
  } catch {
    return false;
  }
};

export const isAdminLoggedIn = (): boolean => !!getAccessToken();

export const logoutAdmin = async () => {
  await apiLogout();
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const subscribeToAdminAuth = (callback: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "bni_access_token") callback();
  };
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("bni-auth-expired", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("bni-auth-expired", callback);
  };
};
