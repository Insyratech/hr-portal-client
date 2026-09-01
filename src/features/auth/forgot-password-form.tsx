'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { Meta } from '@/components/layout/meta';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { clientAuthPath } from '@/lib/site-url';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseBrowserConfigured()) {
      setMessage({ tone: 'warning', text: 'Supabase is not configured on this client.' });
      return;
    }

    const email = String(new FormData(event.currentTarget).get('email') ?? '');
    setPending(true);
    try {
      const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: clientAuthPath('/reset-password'),
      });
      setMessage(
        error
          ? { tone: 'danger', text: error.message }
          : { tone: 'success', text: 'If that account exists, a reset email has been sent.' },
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Meta className="mb-3">HR Portal</Meta>
        <h1 className="text-3xl font-semibold tracking-tight">FORGOT PASSWORD</h1>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        Send reset link
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="hover:text-foreground">
          Login
        </Link>
      </p>
    </form>
  );
}
