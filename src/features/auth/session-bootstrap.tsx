'use client';

import { useEffect } from 'react';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  notifyNativeLoginSuccessWhenReady,
  notifyNativeLogout,
  type NativeLoginPayload,
} from '@/lib/native-app';
import { unregisterNativePushDevice } from '@/features/auth/native-push-bootstrap';
import { api } from '@/store/api/api';
import { useAppDispatch } from '@/store/hooks';
import { clearSession, setAccessToken, setHydrated, setSession } from '@/store/slices/auth-slice';
import { clearPermissions, setPermissions } from '@/store/slices/permissions-slice';
import type { Permission } from '@/types/permissions';

export function SessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      dispatch(setHydrated(true));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    let hadSession = false;

    async function notifyNativeSession(
      accessToken: string,
      refreshToken: string | null,
      authUserId: string,
    ): Promise<void> {
      const payload: NativeLoginPayload = {
        userId: authUserId,
        accessToken,
        refreshToken: refreshToken ?? '',
      };
      await notifyNativeLoginSuccessWhenReady(payload);
    }

    async function applyAccessToken(accessToken: string | null, refreshToken: string | null): Promise<void> {
      if (!accessToken) {
        if (hadSession) {
          await unregisterNativePushDevice(dispatch);
          await notifyNativeLogout();
        }
        dispatch(clearPermissions());
        dispatch(clearSession());
        hadSession = false;
        return;
      }

      dispatch(setAccessToken(accessToken));
      const result = await dispatch(api.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
      if (cancelled) {
        return;
      }

      if ('data' in result && result.data?.success) {
        const me = result.data.data;
        dispatch(
          setSession({
            accessToken,
            user: {
              employeeId: me.employeeId,
              authUserId: me.authUserId,
              name: me.fullName,
              email: me.email,
              roles: me.roles,
            },
          }),
        );
        dispatch(setPermissions(me.permissions as Permission[]));
        hadSession = true;
        await notifyNativeSession(accessToken, refreshToken, me.authUserId);
        return;
      }

      if (hadSession) {
        await unregisterNativePushDevice(dispatch);
        notifyNativeLogout();
      }
      dispatch(clearPermissions());
      dispatch(clearSession());
      hadSession = false;
    }

    void supabase.auth.getSession().then(({ data }) => {
      void applyAccessToken(
        data.session?.access_token ?? null,
        data.session?.refresh_token ?? null,
      );
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyAccessToken(session?.access_token ?? null, session?.refresh_token ?? null);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
