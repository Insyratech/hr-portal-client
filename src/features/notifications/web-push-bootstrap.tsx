'use client';

import { useEffect, useRef } from 'react';
import { isStandaloneDisplayMode } from '@/lib/pwa';
import {
  canSubscribeToWebPush,
  getPushSubscription,
  isPushApiSupported,
  PUSH_ENDPOINT_STORAGE_KEY,
  readStoredPushEndpoint,
  storePushEndpoint,
  subscriptionToPayload,
  unsubscribeFromWebPush,
} from '@/lib/web-push';
import { api } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function WebPushBootstrap() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const syncedEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !accessToken ||
      !isStandaloneDisplayMode() ||
      !canSubscribeToWebPush()
    ) {
      syncedEndpointRef.current = null;
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    let cancelled = false;

    async function syncSubscription(): Promise<void> {
      try {
        const subscription = await getPushSubscription();
        if (!subscription || cancelled) {
          return;
        }

        const payload = subscriptionToPayload(subscription);
        if (syncedEndpointRef.current === payload.endpoint) {
          return;
        }

        const result = await dispatch(api.endpoints.subscribeWebPush.initiate(payload));
        if ('data' in result && result.data?.success) {
          syncedEndpointRef.current = payload.endpoint;
          storePushEndpoint(payload.endpoint);
        }
      } catch {
        // Permission or subscription sync should not block the app.
      }
    }

    void syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [accessToken, dispatch]);

  return null;
}

export async function unregisterWebPush(dispatch: ReturnType<typeof useAppDispatch>): Promise<void> {
  let endpoint = readStoredPushEndpoint();

  try {
    if (isPushApiSupported()) {
      const unsubscribed = await unsubscribeFromWebPush();
      if (unsubscribed) {
        endpoint = unsubscribed;
      }
    }
  } catch {
    // Continue server revoke even if browser unsubscribe fails.
  }

  if (endpoint) {
    await dispatch(api.endpoints.unsubscribeWebPush.initiate({ endpoint }));
  }

  window.localStorage.removeItem(PUSH_ENDPOINT_STORAGE_KEY);
}
