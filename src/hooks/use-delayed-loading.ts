'use client';

import { useEffect, useState } from 'react';

/** True only after `active` stays true for `delayMs` (default 2s) — for long waits. */
export function useDelayedLoading(active: boolean, delayMs = 2000): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return show;
}
