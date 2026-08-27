'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { isSuperAdmin } from '@/features/auth/role-access';
import { DesignationField, resolveDesignationId } from '@/features/employees/designation-field';
import { WorkEmailOtpField } from '@/features/employees/work-email-otp';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateDesignationMutation,
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
} from '@/store/api/api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded border border-border bg-background p-5 shadow-card">
      <Meta>{title}</Meta>
      {children}
    </section>
  );
}

export function CreateEmployeeForm({
  basePath = '/super-admin/employees',
}: {
  basePath?: string;
  /** @deprecated All account creation is Super Admin only (Phase 1). */
  kind?: 'employee' | 'hr-admin' | 'account';
}) {
  const router = useRouter();
  const actorRoles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const allowed = isSuperAdmin(actorRoles);

  if (!allowed) {
    return <p className="text-sm text-muted">Only Super Admin can create employees.</p>;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    if (!emailVerificationToken) {
      const message = 'Confirm the work email with the 4-digit code first.';
      setError(message);
      toast.error(message);
      return;
    }

    try {
      const designationId = await resolveDesignationId(form, (input) => createDesignation(input).unwrap());
      const result = await createEmployee({
        employeeCode: String(form.get('employeeCode') ?? ''),
        fullName: String(form.get('fullName') ?? ''),
        email: email.trim(),
        emailVerificationToken,
        phone: String(form.get('phone') ?? '') || undefined,
        departmentId: String(form.get('departmentId') ?? '') || undefined,
        designationId,
        joiningDate: String(form.get('joiningDate') ?? ''),
        employmentType: String(form.get('employmentType') ?? 'full_time') as
          | 'full_time'
          | 'part_time'
          | 'contract'
          | 'intern',
        password: String(form.get('password') ?? ''),
      }).unwrap();
      toast.success('Employee created.');
      router.replace(`${basePath}/${result.data.id}?created=1`);
    } catch (cause) {
      const message = apiErrorMessage(cause, 'Unable to create employee.');
      setError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted">
        Create the person and login first. HR Manager sets company, shift, leave, and pay on their profile. Grant HR /
        GM / CSO / Finance access later if needed.
      </p>

      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="employeeCode">Staff ID</Label>
            <Input id="employeeCode" name="employeeCode" required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
        </div>
      </Section>

      <Section title="Employment">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="joiningDate">Joining date</Label>
            <Input id="joiningDate" name="joiningDate" type="date" required />
          </div>
          <div>
            <Label htmlFor="employmentType">Employment type</Label>
            <select
              id="employmentType"
              name="employmentType"
              className="h-10 w-full border border-border bg-background px-3 text-sm"
              defaultValue="full_time"
            >
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>
          <div>
            <Label htmlFor="departmentId">Department</Label>
            <select
              id="departmentId"
              name="departmentId"
              className="h-10 w-full border border-border bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">None</option>
              {(departments?.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <DesignationField items={designations?.data ?? []} />
          </div>
        </div>
      </Section>

      <Section title="Login">
        <div className="grid gap-4 sm:grid-cols-2">
          <WorkEmailOtpField
            email={email}
            onEmailChange={setEmail}
            verificationToken={emailVerificationToken}
            onVerified={setEmailVerificationToken}
            onReset={() => setEmailVerificationToken(null)}
          />
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
            <Meta className="mt-1">Minimum 8 characters. Used for first login.</Meta>
          </div>
        </div>
      </Section>

      {error ? (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isLoading || !emailVerificationToken}>
        {isLoading ? 'Creating…' : 'Create employee'}
      </Button>
    </form>
  );
}
