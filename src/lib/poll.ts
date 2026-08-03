import { useEffect, useState } from "react";

/**
 * Polling-friendly interval: returns the interval in ms only while the
 * tab is visible, so backgrounded dashboards don't keep hammering the
 * RPCs. Pass the result as TanStack Query's `refetchInterval` and set
 * `refetchIntervalInBackground: false` (the default).
 */
export function usePollEvery(ms: number): number | false {
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible ? ms : false;
}