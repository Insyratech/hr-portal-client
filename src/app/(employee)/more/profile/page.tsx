'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useCreateGrievanceMutation, useGetEmployeeQuery, useGetMeQuery } from '@/store/api/api';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export default function ProfileDetailsPage() {
  const toast = useToast();
  const { data: me } = useGetMeQuery();
  const employeeId = me?.data.employeeId;
  const { data: employeeData, isLoading } = useGetEmployeeQuery(employeeId ?? '', { skip: !employeeId });
  const [createGrievance, { isLoading: submitting }] = useCreateGrievanceMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const employee = employeeData?.data;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const description = String(new FormData(form).get('description') ?? '').trim();
    if (description.length < 8) {
      setError('Please describe what should change (at least 8 characters).');
      return;
    }
    try {
      await createGrievance({
        category: 'OTHER',
        subject: 'Profile details update',
        description,
      }).unwrap();
      setSuccess('Request sent to HR. They will follow up when your details are updated.');
      toast.success('Profile change request sent.');
      form.reset();
    } catch (cause) {
      const message = apiErrorMessage(cause, 'Unable to send request.');
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader kicker="Account" title="Profile details" />
      <p className="max-w-2xl text-sm text-muted">
        Your personal details are shown here. Name, phone, and similar fields are updated by HR after you request a
        change below.
      </p>

      {isLoading || !employee ? (
        <PageLoading compact message="Loading your profile…" />
      ) : (
        <dl className="grid max-w-2xl gap-6 border border-border bg-background p-5 shadow-card sm:grid-cols-2">
          <Field label="Name" value={employee.fullName} />
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone ?? '—'} />
          <Field label="Company" value={employee.companyName ?? '—'} />
          <Field label="Department" value={employee.departmentName ?? '—'} />
          <Field label="Designation" value={employee.designationName ?? '—'} />
          <Field label="Joining date" value={employee.joiningDate} />
        </dl>
      )}

      <section className="max-w-2xl space-y-4 border border-border bg-background p-5 shadow-card">
        <Meta>Request a change</Meta>
        <p className="text-sm text-muted">
          Tell HR what is wrong or out of date. This opens a request they can action — you cannot edit locked fields
          yourself.
        </p>
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
        {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="profile-change-description">What should be updated?</Label>
            <textarea
              id="profile-change-description"
              name="description"
              required
              minLength={8}
              maxLength={4000}
              rows={4}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Example: Phone number changed to … / Wrong joining date …"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send request to HR'}
          </Button>
        </form>
        <p className="text-sm text-muted">
          Prefer the full grievance form?{' '}
          <Link href="/grievance" className="text-foreground underline-offset-2 hover:underline">
            Open Grievance
          </Link>
        </p>
      </section>
    </div>
  );
}
