'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  enrollNativeBiometric,
  getNativePlatform,
  isBiometricEnrolled,
  isBiometricHardwareAvailable,
  isNativeApp,
} from '@/lib/native-app';
import { useAppSelector } from '@/store/hooks';

const DISMISS_KEY = 'hrportal-biometric-prompt-dismissed';

export function NativeBiometricPrompt() {
  const user = useAppSelector((state) => state.auth.user);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isNativeApp() || getNativePlatform() !== 'android' || !user) {
      return;
    }
    if (window.localStorage.getItem(DISMISS_KEY) === '1') {
      return;
    }

    let cancelled = false;
    void (async () => {
      const [hardware, enrolled] = await Promise.all([
        isBiometricHardwareAvailable(),
        isBiometricEnrolled(),
      ]);
      if (cancelled || !hardware || enrolled) {
        return;
      }
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!visible) {
    return null;
  }

  async function onEnable(): Promise<void> {
    setPending(true);
    setMessage(null);
    const status = await enrollNativeBiometric();
    setPending(false);
    if (status === 'enabled') {
      window.localStorage.setItem(DISMISS_KEY, '1');
      setVisible(false);
      return;
    }
    if (status === 'unavailable') {
      setMessage('Biometric login is not available on this device.');
      return;
    }
    setMessage('Biometric login was not enabled.');
  }

  function onDismiss(): void {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-[65] rounded-xl border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm">
      <p className="text-sm font-medium">Enable biometric login?</p>
      <p className="mt-1 text-xs text-muted">
        Unlock HR Portal with your fingerprint or face. You will still need your password at least once
        every 7 days.
      </p>
      {message ? <p className="mt-2 text-xs text-destructive">{message}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDismiss} disabled={pending}>
          Not now
        </Button>
        <Button type="button" size="sm" onClick={() => void onEnable()} disabled={pending}>
          {pending ? 'Enabling…' : 'Enable'}
        </Button>
      </div>
    </div>
  );
}
