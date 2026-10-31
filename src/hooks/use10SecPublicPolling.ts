/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

/**
 * Hook for 10-second automatic background content refresh on public pages/components.
 *
 * Requirements:
 * 1. Refresh content every 10 seconds.
 * 2. Pause polling when tab is hidden (document.visibilityState === 'hidden').
 * 3. Immediately trigger a background refresh when tab becomes visible and restart interval.
 * 4. Concurrency guard: Prevent overlapping requests if a request takes long.
 * 5. Background mode: Pass `isBackground = true` to `fetchFn` so loading indicators / full-screen overlays are NOT triggered.
 * 6. Mount safety: Prevent state updates on unmounted components.
 */
export function use10SecPublicPolling(
  fetchFn: (isBackground?: boolean) => Promise<void> | void,
  enabled: boolean = true
) {
  const isFetchingRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const isMountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const safeFetch = async (isBackground: boolean) => {
      if (!isMountedRef.current || isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await fetchFnRef.current(isBackground);
      } catch (err) {
        if (isMountedRef.current) {
          console.error("[use10SecPublicPolling] Background refresh error:", err);
        }
      } finally {
        if (isMountedRef.current) {
          isFetchingRef.current = false;
        }
      }
    };

    const startPolling = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        if (isMountedRef.current && document.visibilityState === "visible") {
          safeFetch(true);
        }
      }, 10000);
    };

    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      if (document.visibilityState === "visible") {
        safeFetch(true);
        startPolling();
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.visibilityState === "visible") {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);
}
