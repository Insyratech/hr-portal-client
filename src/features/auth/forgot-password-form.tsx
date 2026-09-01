'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { Meta } from '@/components/layout/meta';
import { apiErrorMessage } from '@/lib/api-error';
import { useRequestPasswordResetMutation } from '@/store/api/api';

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [requestReset, { isLoading: pending }] = useRequestPasswordResetMutation();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const email = String(new FormData(event.currentTarget).get('email') ?? '');
    try {
      await requestReset({ email }).unwrap();
      setMessage({
        tone: 'success',
        text: 'If that account exists, a reset email has been sent. You can request up to 5 reset emails every 3 hours.',
      });
    } catch (error) {
      setMessage({ tone: 'danger', text: apiErrorMessage(error, 'Could not send the reset email.') });
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
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
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="hover:text-foreground">
          Login
        </Link>
      </p>
    </form>
  );
}
