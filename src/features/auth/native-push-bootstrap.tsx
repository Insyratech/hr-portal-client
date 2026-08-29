'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { safeInternalPath } from '@/features/auth/role-access';
import {
  dispatchNativePushNavigate,
  getNativePlatform,
  getOrCreateDeviceId,
  isNativeApp,
  NATIVE_PUSH_NAVIGATE_EVENT,
} from '@/lib/native-app';
import { api } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const DEVICE_STORAGE_KEY = 'hrportal-push-token';

function readStoredPushToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(DEVICE_STORAGE_KEY);
}

function storePushToken(token: string): void {
  window.localStorage.setItem(DEVICE_STORAGE_KEY, token);
}

function clearStoredPushToken(): void {
  window.localStorage.removeItem(DEVICE_STORAGE_KEY);
}

export function NativePushBootstrap() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const registeredTokenRef = useRef<string | null>(null);
  const listenersReadyRef = useRef(false);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    function onPushNavigate(event: Event): void {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      const path = safeInternalPath(detail?.path);
      if (path) {
        router.push(path);
      }
    }

    window.addEventListener(NATIVE_PUSH_NAVIGATE_EVENT, onPushNavigate);
    return () => {
      window.removeEventListener(NATIVE_PUSH_NAVIGATE_EVENT, onPushNavigate);
    };
  }, [router]);

  useEffect(() => {
    if (!isNativeApp() || listenersReadyRef.current) {
      return;
    }

    listenersReadyRef.current = true;
    let cancelled = false;

    async function setupPush(): Promise<void> {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permission = await PushNotifications.requestPermissions();
      if (cancelled || permission.receive !== 'granted') {
        return;
      }

      await PushNotifications.register();

      await PushNotifications.addListener('registration', (token) => {
        if (!token.value) {
          return;
        }
        storePushToken(token.value);
        registeredTokenRef.current = null;
      });

      await PushNotifications.addListener('registrationError', () => {
        clearStoredPushToken();
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const deepLink =
          (action.notification.data?.deepLink as string | undefined) ??
          (action.notification.data?.deeplink as string | undefined);
        const path = safeInternalPath(deepLink);
        if (path) {
          dispatchNativePushNavigate(path);
        }
      });
    }

    void setupPush();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp() || !accessToken) {
      registeredTokenRef.current = null;
      return;
    }

    const pushToken = readStoredPushToken();
    const platform = getNativePlatform();
    if (!pushToken || !platform) {
      return;
    }

    if (registeredTokenRef.current === pushToken) {
      return;
    }

    void dispatch(
      api.endpoints.registerMobileDevice.initiate({
        deviceId: getOrCreateDeviceId(),
        platform,
        pushToken,
      }),
    ).then((result) => {
      if ('data' in result && result.data?.success) {
        registeredTokenRef.current = pushToken;
      }
    });
  }, [accessToken, dispatch]);

  return null;
}

export async function unregisterNativePushDevice(dispatch: ReturnType<typeof useAppDispatch>): Promise<void> {
  if (!isNativeApp()) {
    return;
  }

  const deviceId = getOrCreateDeviceId();
  await dispatch(api.endpoints.unregisterMobileDevice.initiate(deviceId));
  clearStoredPushToken();
}
