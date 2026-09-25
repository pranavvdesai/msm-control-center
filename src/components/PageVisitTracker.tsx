"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const DEBOUNCE_MS = 2 * 60 * 1000;

export function PageVisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const now = Date.now();
    const prev = lastTracked.current;
    if (prev && prev.path === pathname && now - prev.at < DEBOUNCE_MS) {
      return;
    }

    lastTracked.current = { path: pathname, at: now };

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
