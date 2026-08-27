'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useSendWorkEmailOtpMutation, useVerifyWorkEmailOtpMutation } from '@/store/api/api';

export function WorkEmailOtpField({
  email,
  onEmailChange,
  verificationToken,
  onVerified,
  onReset,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  verificationToken: string | null;
  onVerified: (token: string) => void;
  onReset: () => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [sendOtp, { isLoading: sending }] = useSendWorkEmailOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyWorkEmailOtpMutation();
  const confirmed = Boolean(verificationToken);

  async function send() {
    try {
      await sendOtp({ email }).unwrap();
      setSent(true);
      setCode('');
      onReset();
      toast.success('A 4-digit code was sent to this email.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to send the code.'));
    }
  }

  async function verify() {
    try {
      const result = await verifyOtp({ email, code }).unwrap();
      onVerified(result.data.emailVerificationToken);
      toast.success('Work email confirmed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to confirm this email.'));
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="email">Work email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        readOnly={confirmed}
        onChange={(event) => {
          onEmailChange(event.target.value);
          setSent(false);
          setCode('');
          onReset();
        }}
      />
      {confirmed ? (
        <p className="text-sm text-muted">This email is confirmed. Updates will go here.</p>
      ) : (
        <>
          <Button type="button" size="sm" variant="outline" disabled={sending || email.trim().length < 3} onClick={() => void send()}>
            {sending ? 'Sending…' : sent ? 'Send again' : 'Send 4-digit code'}
          </Button>
          {sent ? (
            <div>
              <Label htmlFor="emailOtp">Code from email</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="emailOtp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <Button type="button" size="sm" disabled={verifying || code.length !== 4} onClick={() => void verify()}>
                  {verifying ? 'Checking…' : 'Confirm'}
                </Button>
              </div>
              <Meta className="mt-1">Ask the person to open their inbox and read the 4-digit code to you.</Meta>
            </div>
          ) : (
            <Meta>We send a short code so this address is real before you create the login.</Meta>
          )}
        </>
      )}
    </div>
  );
}
