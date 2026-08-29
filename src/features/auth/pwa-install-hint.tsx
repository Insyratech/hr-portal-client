'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  getPwaInstallPlatform,
  PWA_INSTALL_HINT_DISMISS_KEY,
  type PwaInstallPlatform,
} from '@/lib/pwa';

function installInstructions(platform: PwaInstallPlatform): { title: string; body: ReactNode } {
  if (platform === 'ios') {
    return {
      title: 'Install HR Portal on your iPhone',
      body: (
        <>
          Tap <span className="font-medium text-foreground">Share</span> →{' '}
          <span className="font-medium text-foreground">Add to Home Screen</span> → Add. Open from your home
          screen for quick access and notifications.
        </>
      ),
    };
  }

  return {
    title: 'Install HR Portal on your phone',
    body: (
      <>
        Tap the menu <span className="font-medium text-foreground">(⋮)</span> →{' '}
        <span className="font-medium text-foreground">Add to Home screen</span> or{' '}
        <span className="font-medium text-foreground">Install app</span>. Open from your home screen for
        notifications.
      </>
    ),
  };
}

export function PwaInstallHint() {
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.localStorage.getItem(PWA_INSTALL_HINT_DISMISS_KEY) === '1') {
      return;
    }
    const detected = getPwaInstallPlatform();
    if (detected) {
      setPlatform(detected);
    }
  }, []);

  if (!platform) {
    return null;
  }

  const { title, body } = installInstructions(platform);

  function dismiss(): void {
    window.localStorage.setItem(PWA_INSTALL_HINT_DISMISS_KEY, '1');
    setPlatform(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-background/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-lg backdrop-blur">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted">{body}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
          onClick={dismiss}
        >
          Not now
        </button>
        <button
          type="button"
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          onClick={dismiss}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
