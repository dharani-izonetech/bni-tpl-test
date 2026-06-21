import { useEffect, useState, useCallback } from "react";
import {
  getNewsItems,
  getNewsItemsAsync,
  getNewsItemsAdminAsync,
  addNewsItem,
  updateNewsItem,
  deleteNewsItem,
  subscribeToNewsItems,
  type NewsItem,
  type NewsFormValues,
} from "@/lib/newsStorage";

export const useNews = (adminMode = false) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getNewsItems());
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const items = adminMode ? await getNewsItemsAdminAsync() : await getNewsItemsAsync();
      setNewsItems(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  // Subscribe to in-memory events (triggered after mutations)
  useEffect(() => {
    const unsub = subscribeToNewsItems(() => setNewsItems(getNewsItems()));
    return unsub;
  }, []);

  // Initial load
  useEffect(() => { void refresh(); }, [refresh]);

  const addItem = useCallback(async (values: NewsFormValues) => {
    const newItem = await addNewsItem(values);
    return newItem;
  }, []);

  const editItem = useCallback(async (id: string, values: NewsFormValues) => {
    const updated = await updateNewsItem(id, values);
    return updated;
  }, []);

  const removeItem = useCallback(async (id: string) => {
    await deleteNewsItem(id);
  }, []);

  return { newsItems, loading, error, addItem, editItem, removeItem, refresh };
};
