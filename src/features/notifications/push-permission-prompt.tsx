'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isStandaloneDisplayMode } from '@/lib/pwa';
import {
  canSubscribeToWebPush,
  isIosDevice,
  isPushApiSupported,
  PUSH_PROMPT_DISMISS_KEY,
  storePushEndpoint,
  subscribeToWebPush,
  subscriptionToPayload,
} from '@/lib/web-push';
import { api } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function PushPermissionPrompt() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      return;
    }
    if (!isPushApiSupported() || window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) === '1') {
      return;
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }
    if (isIosDevice() && !isStandaloneDisplayMode()) {
      return;
    }
    if (!canSubscribeToWebPush()) {
      return;
    }
    setVisible(true);
  }, [user]);

  if (!visible) {
    return null;
  }

  async function onEnable(): Promise<void> {
    setPending(true);
    setMessage(null);
    try {
      const subscription = await subscribeToWebPush();
      const payload = subscriptionToPayload(subscription);
      const result = await dispatch(api.endpoints.subscribeWebPush.initiate(payload));
      if ('data' in result && result.data?.success) {
        storePushEndpoint(payload.endpoint);
        window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, '1');
        setVisible(false);
        return;
      }
      setMessage('Notifications could not be enabled. Try again later.');
    } catch {
      setMessage('Notifications were not enabled.');
    } finally {
      setPending(false);
    }
  }

  function onDismiss(): void {
    window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-[65] rounded-xl border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm">
      <p className="text-sm font-medium">Enable notifications?</p>
      <p className="mt-1 text-xs text-muted">
        Get alerts for leave updates, payslips, and other HR actions — even when the app is closed.
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
