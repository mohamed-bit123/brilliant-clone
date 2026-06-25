"use client";

import { useEffect, useState } from "react";

// Module-level cache so we only ask the server once per page load.
let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function fetchStatus(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d: { enabled?: boolean }) => {
        cached = Boolean(d.enabled);
        return cached;
      })
      .catch(() => {
        cached = false;
        return false;
      });
  }
  return inflight;
}

/** Returns whether AI features are configured on the server. */
export function useAIStatus(): boolean {
  const [enabled, setEnabled] = useState<boolean>(cached ?? false);

  useEffect(() => {
    let active = true;
    fetchStatus().then((v) => {
      if (active) setEnabled(v);
    });
    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
