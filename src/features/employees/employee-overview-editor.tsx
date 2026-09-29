'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { DesignationField, resolveDesignationId } from '@/features/employees/designation-field';
import { WorkEmailOtpField } from '@/features/employees/work-email-otp';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { normalizeEmail } from '@/lib/email';
import { useAppSelector } from '@/store/hooks';
import type { Employee } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateDesignationMutation,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useUpdateEmployeeMutation,
} from '@/store/api/api';

function dateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function EmployeeOverviewEditor({ employee }: { employee: Employee }) {
  const canCreateDesignation = useAppSelector((state) => {
    const permissions = state.permissions.permissions;
    return (
      permissions.includes(PERMISSIONS.SYSTEM_MANAGE) || permissions.includes(PERMISSIONS.USERS_MANAGE)
    );
  });
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const toast = useToast();
  const [email, setEmail] = useState(employee.email);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);

  useEffect(() => {
    setEmail(employee.email);
    setEmailVerificationToken(null);
  }, [employee.id, employee.email, employee.updatedAt]);

  const emailChanged = normalizeEmail(email) !== normalizeEmail(employee.email);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const departmentId = String(form.get('departmentId') ?? '');
    const phone = String(form.get('phone') ?? '');

    if (emailChanged && !emailVerificationToken) {
      toast.error('Confirm the new work email with the 4-digit code before saving.');
      return;
    }

    try {
      const designationId = (await resolveDesignationId(form, (input) => createDesignation(input).unwrap())) ?? null;
      const body: Record<string, unknown> = {
        employeeCode: String(form.get('employeeCode') ?? ''),
        fullName: String(form.get('fullName') ?? ''),
        phone: phone || null,
        departmentId: departmentId || null,
        designationId,
        joiningDate: dateInputValue(String(form.get('joiningDate') ?? '')),
        employmentType: String(form.get('employmentType') ?? 'full_time'),
      };
      if (emailChanged) {
        body.email = email.trim();
        body.emailVerificationToken = emailVerificationToken;
      }
      await updateEmployee({ id: employee.id, body }).unwrap();
      setEmailVerificationToken(null);
      toast.success(emailChanged ? 'Login email and details saved.' : 'Employee details saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save employee.'));
    }
  }

  return (
    <form key={employee.updatedAt} onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <Meta>Edit personal details</Meta>
      <p className="text-sm text-muted">
        Company, shift, leave, and pay are set by HR Manager — not here. To change the login email, send a
        4-digit code to the new inbox and confirm it before saving.
      </p>
      <p className="text-sm">
        <span className="text-muted">Company: </span>
        {employee.companyName ?? 'Not assigned yet'}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={employee.fullName} required />
        </div>
        <div>
          <Label htmlFor="employeeCode">Staff ID</Label>
          <Input id="employeeCode" name="employeeCode" defaultValue={employee.employeeCode} required />
        </div>
        <div className="sm:col-span-2">
          {emailChanged ? (
            <WorkEmailOtpField
              mode="change"
              email={email}
              onEmailChange={setEmail}
              verificationToken={emailVerificationToken}
              onVerified={setEmailVerificationToken}
              onReset={() => setEmailVerificationToken(null)}
            />
          ) : (
            <div className="space-y-3">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailVerificationToken(null);
                }}
              />
              <Meta>Edit the address only if the login email must change — OTP confirmation will appear.</Meta>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={employee.phone ?? ''} />
        </div>
        <div>
          <Label htmlFor="joiningDate">Joining date</Label>
          <Input id="joiningDate" name="joiningDate" type="date" defaultValue={dateInputValue(employee.joiningDate)} required />
        </div>
        <div>
          <Label htmlFor="employmentType">Employment type</Label>
          <select
            id="employmentType"
            name="employmentType"
            className="h-10 w-full border border-border bg-background px-3 text-sm"
            defaultValue={employee.employmentType}
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
            defaultValue={employee.departmentId ?? ''}
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
          <DesignationField
            items={designations?.data ?? []}
            defaultId={employee.designationId ?? ''}
            allowCreate={canCreateDesignation}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading || (emailChanged && !emailVerificationToken)}>
        {isLoading ? 'Saving…' : emailChanged ? 'Save email & details' : 'Save details'}
      </Button>
    </form>
  );
}
