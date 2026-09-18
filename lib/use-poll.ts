"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onRefreshRequest } from "./refresh-bus";

/**
 * Keep a dashboard view current.
 *
 * "Receipts appear as the agent spends" cannot be true of a fetch that runs
 * once on mount. This polls on an interval, and also refreshes when something
 * in the dashboard asks for it, so an action's effect shows immediately.
 */
export function usePoll<T>(url: string, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const body = (await response.json()) as T;
      if (!mounted.current) return;
      setData(body);
      setError(null);
    } catch (cause) {
      if (!mounted.current) return;
      setError(cause instanceof Error ? cause.message : "request failed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), intervalMs);
    const unsubscribe = onRefreshRequest(() => void refresh());
    return () => {
      mounted.current = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
