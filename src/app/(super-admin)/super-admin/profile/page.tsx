'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api-error';
import { useGetEmployeeQuery, useGetMeQuery, useUpdateEmployeeMutation } from '@/store/api/api';

export default function SuperAdminProfilePage() {
  const { data: me } = useGetMeQuery();
  const employeeId = me?.data.employeeId ?? '';
  const { data } = useGetEmployeeQuery(employeeId, { skip: !employeeId });
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const employee = data?.data;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employeeId) return;
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const notificationEmail = String(form.get('notificationEmail') ?? '').trim();
    try {
      await updateEmployee({
        id: employeeId,
        body: {
          fullName: String(form.get('fullName') ?? ''),
          phone: String(form.get('phone') ?? '') || null,
          notificationEmail: notificationEmail || null,
        },
      }).unwrap();
      setMessage('Profile saved. Update mail will use the notification address when it is set.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save profile.'));
    }
  }

  if (!employee) {
    return (
      <>
        <PageHeader kicker="Account" title="Profile" />
        <p className="text-sm text-muted">Loading your profile…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Account" title="Profile" />
      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={employee.fullName} required />
        </div>
        <div>
          <Label htmlFor="email">Login email</Label>
          <Input id="email" value={employee.email} disabled readOnly />
          <Meta className="mt-1">Used to sign in. It cannot be changed here.</Meta>
        </div>
        <div>
          <Label htmlFor="notificationEmail">Notification email</Label>
          <Input
            id="notificationEmail"
            name="notificationEmail"
            type="email"
            defaultValue={employee.notificationEmail ?? ''}
            placeholder="name@company.com"
          />
          <Meta className="mt-1">Leave, holiday, and other update mail is sent here. If empty, login email is used.</Meta>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={employee.phone ?? ''} />
        </div>
        {error ? <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p> : null}
        {message ? <p className="text-sm text-muted">{message}</p> : null}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </>
  );
}
