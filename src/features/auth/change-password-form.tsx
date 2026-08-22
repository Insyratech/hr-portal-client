'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { PageHeader } from '@/components/layout/page-header';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAppSelector } from '@/store/hooks';

export function ChangePasswordForm() {
  const email = useAppSelector((state) => state.auth.user?.email ?? '');
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseBrowserConfigured()) {
      setMessage({ tone: 'warning', text: 'Supabase is not configured on this client.' });
      return;
    }

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (newPassword.length < 8) {
      setMessage({ tone: 'danger', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ tone: 'danger', text: 'New password and confirmation do not match.' });
      return;
    }
    if (!email) {
      setMessage({ tone: 'danger', text: 'Signed-in email is missing. Sign in again.' });
      return;
    }

    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        setMessage({ tone: 'danger', text: 'Current password is incorrect.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setMessage(
        error
          ? { tone: 'danger', text: error.message }
          : { tone: 'success', text: 'Password updated. Use the new password next time you sign in.' },
      );
      if (!error) {
        event.currentTarget.reset();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader kicker="Account" title="Change password" />
      <form onSubmit={onSubmit} className="max-w-md space-y-5">
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Updating…' : 'Update password'}
        </Button>
        <p className="text-sm text-muted">
          <Link href="/more" className="hover:text-foreground">
            Back to More
          </Link>
        </p>
      </form>
    </>
  );
}
