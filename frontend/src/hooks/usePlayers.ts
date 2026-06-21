import { useEffect, useState, useCallback } from "react";
import {
  loadRegisteredPlayers,
  loadRegisteredPlayersAdminAsync,
  deleteRegisteredPlayer,
  updateRegisteredPlayer,
  subscribeToRegisteredPlayers,
  exportPlayersCSV,
  type RegisteredPlayer,
} from "@/lib/registeredPlayersStorage";

export const usePlayers = () => {
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRegisteredPlayersAdminAsync(search);
      setPlayers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load players";
      setError(msg);
      console.error("[usePlayers] refresh failed:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to cache updates (e.g. after delete/update)
  useEffect(() => {
    const unsub = subscribeToRegisteredPlayers(() => {
      const cached = loadRegisteredPlayers();
      if (cached.length > 0) setPlayers(cached);
    });
    return unsub;
  }, []);

  // Initial load
  useEffect(() => { void refresh(); }, [refresh]);

  const removePlayer = useCallback(async (id: string) => {
    await deleteRegisteredPlayer(id);
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const editPlayer = useCallback(async (updated: RegisteredPlayer) => {
    await updateRegisteredPlayer(updated);
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  const exportCSV = useCallback(async () => {
    await exportPlayersCSV();
  }, []);

  return { players, loading, error, removePlayer, editPlayer, exportCSV, refresh };
};
