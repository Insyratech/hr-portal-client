'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { PasswordInput } from '@/components/ui/password-input';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { Meta } from '@/components/layout/meta';
import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { destinationAfterLogin } from '@/features/auth/role-access';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { api, useGetHealthQuery } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAccessToken, setSession } from '@/store/slices/auth-slice';
import { setPermissions } from '@/store/slices/permissions-slice';
import type { Permission } from '@/types/permissions';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data, isError, isFetching } = useGetHealthQuery();
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const apiLabel = isFetching ? 'Checking' : data?.success ? 'OK' : isError ? 'Down' : 'Idle';

  function destination(roles: string[]): string {
    return destinationAfterLogin(roles, searchParams.get('next'));
  }

  useEffect(() => {
    if (user) {
      router.replace(destination(user.roles));
    }
  }, [router, user, searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseBrowserConfigured()) {
      setMessage({ tone: 'warning', text: 'Supabase is not configured on this client.' });
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signIn.session) {
        setMessage({ tone: 'danger', text: signInError?.message ?? 'Unable to sign in.' });
        return;
      }

      dispatch(setAccessToken(signIn.session.access_token));
      const meResult = await dispatch(
        api.endpoints.getMe.initiate(undefined, { forceRefetch: true }),
      );
      if (!('data' in meResult) || !meResult.data?.success) {
        setMessage({ tone: 'danger', text: 'Signed in, but the employee profile could not be loaded.' });
        await supabase.auth.signOut();
        return;
      }

      const me = meResult.data.data;
      dispatch(
        setSession({
          accessToken: signIn.session.access_token,
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
      router.replace(destination(me.roles));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <LoadingOverlay open={pending || Boolean(user)} message="We are almost there…" />
      <form onSubmit={onSubmit} className="space-y-6" autoComplete="off">
        <div>
          <Meta className="mb-3">HR Portal</Meta>
          <h1 className="text-3xl font-semibold tracking-tight">LOGIN</h1>
        </div>
        <div className="sr-only" aria-hidden="true">
          <input type="text" name="fake-user" autoComplete="username" tabIndex={-1} />
          <input type="password" name="fake-pass" autoComplete="current-password" tabIndex={-1} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="name@company.com"
            readOnly
            onFocus={(event) => {
              event.currentTarget.readOnly = false;
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password"
            readOnly
            onFocus={(event) => {
              event.currentTarget.readOnly = false;
            }}
            required
          />
        </div>
        {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? 'Signing in' : 'Sign in'}
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password
          </Link>
        </p>
        <div
          className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-muted"
          aria-live="polite"
        >
          API · {apiLabel}
          {isFetching ? <ThreeDotsSpinner size="sm" label="Checking API" /> : null}
        </div>
      </form>
    </>
  );
}

