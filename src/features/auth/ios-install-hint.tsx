'use client';

import { useEffect, useState } from 'react';
import { isNativeApp } from '@/lib/native-app';
import { isIosSafari, isStandaloneDisplayMode } from '@/lib/pwa';

const DISMISS_KEY = 'hrportal-ios-install-hint-dismissed';

export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (isNativeApp() || !isIosSafari() || isStandaloneDisplayMode()) {
      return;
    }
    if (window.localStorage.getItem(DISMISS_KEY) === '1') {
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-background/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-lg backdrop-blur">
      <p className="text-sm font-medium">Install HR Portal on your iPhone</p>
      <p className="mt-1 text-xs text-muted">
        Tap <span className="font-medium text-foreground">Share</span> →{' '}
        <span className="font-medium text-foreground">Add to Home Screen</span> → Add. Open from your home
        screen for quick access.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1');
            setVisible(false);
          }}
        >
          Not now
        </button>
        <button
          type="button"
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1');
            setVisible(false);
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
