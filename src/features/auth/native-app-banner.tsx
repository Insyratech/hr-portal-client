'use client';

import { useEffect, useState } from 'react';
import {
  getNativePlatform,
  isNativeApp,
  isNativeBridgeReady,
  NATIVE_BRIDGE_READY_EVENT,
} from '@/lib/native-app';

export function useNativeBridgeReady(): boolean {
  const [ready, setReady] = useState(() => isNativeBridgeReady());

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    const markReady = () => {
      if (isNativeBridgeReady()) {
        setReady(true);
      }
    };

    markReady();
    const intervalId = window.setInterval(markReady, 250);
    window.addEventListener(NATIVE_BRIDGE_READY_EVENT, markReady);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(NATIVE_BRIDGE_READY_EVENT, markReady);
    };
  }, []);

  return ready;
}

export function NativeAppBanner() {
  const bridgeReady = useNativeBridgeReady();

  if (!isNativeApp() || !bridgeReady) {
    return null;
  }

  const platform = getNativePlatform();
  const label = platform === 'ios' ? 'HR Portal · iOS' : platform === 'android' ? 'HR Portal · Android' : 'HR Portal app';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(env(safe-area-inset-top),0.5rem)]"
      aria-hidden="true"
    >
      <span className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-[11px] font-medium tracking-wide text-muted shadow-sm backdrop-blur">
        {label}
      </span>
    </div>
  );
}
