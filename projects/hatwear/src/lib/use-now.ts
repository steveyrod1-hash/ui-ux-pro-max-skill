"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed every `everyMs`. Starts with the render time so
 * server and first client render agree, then ticks after mount.
 */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** False during server render and the first client render; true after mount. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
