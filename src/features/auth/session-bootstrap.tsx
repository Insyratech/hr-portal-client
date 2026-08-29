'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import {
  clearPasswordAuth,
  shouldRequirePasswordReauth,
  touchPasswordAuthIfMissing,
} from '@/lib/session-policy';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { unregisterWebPush } from '@/features/notifications/web-push-bootstrap';
import { api } from '@/store/api/api';
import { useAppDispatch } from '@/store/hooks';
import { clearSession, setAccessToken, setHydrated, setSession } from '@/store/slices/auth-slice';
import { clearPermissions, setPermissions } from '@/store/slices/permissions-slice';
import type { Permission } from '@/types/permissions';

export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      dispatch(setHydrated(true));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    let hadSession = false;

    async function expirePasswordSession(): Promise<void> {
      if (hadSession) {
        await unregisterWebPush(dispatch);
      }
      clearPasswordAuth();
      await supabase.auth.signOut();
      dispatch(clearPermissions());
      dispatch(clearSession());
      hadSession = false;
      router.replace('/login?reason=credential_expired');
    }

    async function applyAccessToken(accessToken: string | null): Promise<void> {
      if (!accessToken) {
        if (hadSession) {
          await unregisterWebPush(dispatch);
        }
        dispatch(clearPermissions());
        dispatch(clearSession());
        hadSession = false;
        return;
      }

      if (shouldRequirePasswordReauth()) {
        await expirePasswordSession();
        return;
      }
      touchPasswordAuthIfMissing();

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
        return;
      }

      if (hadSession) {
        await unregisterWebPush(dispatch);
      }
      dispatch(clearPermissions());
      dispatch(clearSession());
      hadSession = false;
    }

    void supabase.auth.getSession().then(({ data }) => {
      void applyAccessToken(data.session?.access_token ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyAccessToken(session?.access_token ?? null);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [dispatch, router]);

  return null;
}
