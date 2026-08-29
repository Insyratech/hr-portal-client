'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  NATIVE_SESSION_INJECTED_EVENT,
} from '@/lib/supabase-session';
import {
  isNativeApp,
  NATIVE_CREDENTIAL_EXPIRED_EVENT,
  waitForNativeBridge,
} from '@/lib/native-app';
import { api } from '@/store/api/api';
import { useAppDispatch } from '@/store/hooks';
import { clearSession, setAccessToken, setHydrated, setSession } from '@/store/slices/auth-slice';
import { clearPermissions, setPermissions } from '@/store/slices/permissions-slice';
import type { Permission } from '@/types/permissions';

export function NativeSessionBridge() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp() || !isSupabaseBrowserConfigured()) {
      return;
    }

    async function hydrateFromSupabase(): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      if (!accessToken) {
        dispatch(setHydrated(true));
        return;
      }

      dispatch(setAccessToken(accessToken));
      const result = await dispatch(api.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
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
      }
      dispatch(setHydrated(true));
    }

    function onSessionInjected(): void {
      void hydrateFromSupabase();
    }

    function onCredentialExpired(): void {
      dispatch(clearPermissions());
      dispatch(clearSession());
      router.replace('/login?reason=credential_expired');
    }

    window.addEventListener(NATIVE_SESSION_INJECTED_EVENT, onSessionInjected);
    window.addEventListener(NATIVE_CREDENTIAL_EXPIRED_EVENT, onCredentialExpired);

    void waitForNativeBridge().then(() => {
      void hydrateFromSupabase();
    });

    return () => {
      window.removeEventListener(NATIVE_SESSION_INJECTED_EVENT, onSessionInjected);
      window.removeEventListener(NATIVE_CREDENTIAL_EXPIRED_EVENT, onCredentialExpired);
    };
  }, [dispatch, router]);

  return null;
}
