'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { apiErrorMessage } from '@/lib/api-error';
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

function pushSubscribeErrorMessage(error: unknown): string {
  const message = apiErrorMessage(error, '');
  if (message) {
    return message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Notifications could not be enabled. Try again later.';
}

export function PushPermissionPrompt() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
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
    if (!accessToken) {
      setMessage('Please wait until you are fully signed in, then try again.');
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const subscription = await subscribeToWebPush();
      const payload = subscriptionToPayload(subscription);
      await dispatch(api.endpoints.subscribeWebPush.initiate(payload)).unwrap();
      storePushEndpoint(payload.endpoint);
      window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, '1');
      setVisible(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        setMessage('Browser notification permission was blocked. Enable it in your device settings.');
      } else {
        setMessage(pushSubscribeErrorMessage(error));
      }
    } finally {
      setPending(false);
    }
  }

  function onDismiss(): void {
    if (pending) {
      return;
    }
    window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent showClose={false} className="max-w-sm overflow-hidden p-0">
        <div className="border-b border-border bg-muted/30 px-6 pb-5 pt-8 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background shadow-card"
            aria-hidden
          >
            <Icon name="bell" className="h-7 w-7" />
          </div>
          <DialogTitle className="mt-5 text-center text-base normal-case tracking-normal text-foreground">
            Allow notifications
          </DialogTitle>
          <DialogDescription className="mt-2 text-center text-sm text-muted">
            Get alerts for leave updates, payslips, and other HR actions — even when the app is closed.
          </DialogDescription>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted">
            Your browser will ask for permission next. Choose <span className="font-medium text-foreground">Allow</span>{' '}
            to receive HR alerts on this device.
          </p>

          {message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {message}
            </p>
          ) : null}

          <div className="space-y-2">
            <Button type="button" className="w-full" onClick={() => void onEnable()} disabled={pending}>
              {pending ? 'Opening permission…' : 'Allow notifications'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted"
              onClick={onDismiss}
              disabled={pending}
            >
              Not now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
