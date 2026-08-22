'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { AssignableRoleChecks } from '@/features/employees/onboarding-roles';
import { DesignationField, resolveDesignationId } from '@/features/employees/designation-field';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateDesignationMutation,
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetRolesQuery,
} from '@/store/api/api';

export function CreateEmployeeForm({
  basePath = '/super-admin/employees',
}: {
  basePath?: string;
}) {
  const router = useRouter();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const { data: roles } = useGetRolesQuery();
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const roleIds = form.getAll('roleIds').map(String).filter(Boolean);
    if (roleIds.length === 0) {
      setError('Select at least one access role.');
      return;
    }

    try {
      const designationId = await resolveDesignationId(form, (input) => createDesignation(input).unwrap());
      const result = await createEmployee({
        employeeCode: String(form.get('employeeCode') ?? ''),
        fullName: String(form.get('fullName') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? '') || undefined,
        dateOfBirth: String(form.get('dateOfBirth') ?? '') || undefined,
        departmentId: String(form.get('departmentId') ?? '') || undefined,
        designationId,
        joiningDate: String(form.get('joiningDate') ?? ''),
        employmentType: String(form.get('employmentType') ?? 'full_time') as
          | 'full_time'
          | 'part_time'
          | 'contract'
          | 'intern',
        roleIds,
        password: String(form.get('password') ?? ''),
      }).unwrap();
      router.replace(`${basePath}/${result.data.id}`);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create employee.'));
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <p className="text-sm text-muted">
        Creates a login and employee profile. Share the temporary password securely; the person can change it after signing in.
      </p>
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="employeeCode">Employee ID</Label>
        <Input id="employeeCode" name="employeeCode" required />
      </div>
      <div>
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <Meta className="mt-1">Minimum 8 characters. Used for first login.</Meta>
      </div>
      <AssignableRoleChecks roles={roles?.data ?? []} selectedCodes={['EMPLOYEE']} />
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div>
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" />
      </div>
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
      <DesignationField items={designations?.data ?? []} />
      {error ? <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating…' : 'Create employee'}
      </Button>
    </form>
  );
}
