'use client';

import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { PageLoading } from '@/components/ui/page-loading';
import { PasswordInput } from '@/components/ui/password-input';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { clearPasswordAuth } from '@/lib/session-policy';
import { getSupabaseBrowserClient } from '@/lib/supabase';

function hasRecoveryTokenInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  return hash.includes('type=recovery') || hash.includes('access_token=');
}

export function ResetPasswordForm() {
  const router = useRouter();
  const hadRecoveryHash = useRef(hasRecoveryTokenInUrl());
  const [phase, setPhase] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setPhase('invalid');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let settled = false;

    function markReady() {
      if (settled) return;
      settled = true;
      setPhase('ready');
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && hadRecoveryHash.current) {
        markReady();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        markReady();
      }
    });

    const timer = window.setTimeout(() => {
      if (!settled) setPhase('invalid');
    }, 10_000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (newPassword.length < 8) {
      setMessage({ tone: 'danger', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'danger', text: 'Password and confirmation do not match.' });
      return;
    }

    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setMessage({ tone: 'danger', text: error.message });
        return;
      }

      clearPasswordAuth();
      await supabase.auth.signOut();
      router.replace('/login?reset=success');
    } finally {
      setPending(false);
    }
  }

  if (phase === 'loading') {
    return <PageLoading compact message="Opening reset link…" />;
  }

  if (phase === 'invalid') {
    return (
      <div className="space-y-6">
        <div>
          <Meta className="mb-3">HR Portal</Meta>
          <h1 className="text-3xl font-semibold tracking-tight">RESET LINK EXPIRED</h1>
        </div>
        <p className="text-sm text-muted">
          This link is invalid or has expired. Request a new reset email and open the latest link.
        </p>
        <Button asChild type="button" className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="hover:text-foreground">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
      <div>
        <Meta className="mb-3">HR Portal</Meta>
        <h1 className="text-3xl font-semibold tracking-tight">SET NEW PASSWORD</h1>
        <p className="mt-2 text-sm text-muted">Choose a new password, then sign in with it.</p>
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Update password'}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="hover:text-foreground">
          Back to login
        </Link>
      </p>
    </form>
  );
}
