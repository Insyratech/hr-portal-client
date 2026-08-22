'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { AssignableRoleChecks } from '@/features/employees/onboarding-roles';
import { DesignationField, resolveDesignationId } from '@/features/employees/designation-field';
import { apiErrorMessage } from '@/lib/api-error';
import type { Employee } from '@/types/api';
import {
  useCreateDesignationMutation,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetRolesQuery,
  useUpdateEmployeeMutation,
} from '@/store/api/api';

function dateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function EmployeeOverviewEditor({ employee }: { employee: Employee }) {
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const { data: roles } = useGetRolesQuery();
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const departmentId = String(form.get('departmentId') ?? '');
    const roleIds = form.getAll('roleIds').map(String).filter(Boolean);
    const phone = String(form.get('phone') ?? '');
    const dateOfBirth = String(form.get('dateOfBirth') ?? '');
    if (roleIds.length === 0) {
      setError('Select at least one access role.');
      return;
    }

    try {
      const designationId = (await resolveDesignationId(form, (input) => createDesignation(input).unwrap())) ?? null;
      await updateEmployee({
        id: employee.id,
        body: {
          employeeCode: String(form.get('employeeCode') ?? ''),
          fullName: String(form.get('fullName') ?? ''),
          phone: phone || null,
          dateOfBirth: dateOfBirth || null,
          departmentId: departmentId || null,
          designationId,
          joiningDate: dateInputValue(String(form.get('joiningDate') ?? '')),
          employmentType: String(form.get('employmentType') ?? 'full_time'),
          status: String(form.get('status') ?? 'active'),
          roleIds,
        },
      }).unwrap();
      setMessage('Employee details saved.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save employee.'));
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <Meta>Edit profile</Meta>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={employee.fullName} required />
        </div>
        <div>
          <Label htmlFor="employeeCode">Employee ID</Label>
          <Input id="employeeCode" name="employeeCode" defaultValue={employee.employeeCode} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={employee.email} disabled readOnly />
          <Meta className="mt-1">Login email cannot be changed here.</Meta>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={employee.phone ?? ''} />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dateInputValue(employee.dateOfBirth)} />
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
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="h-10 w-full border border-border bg-background px-3 text-sm"
            defaultValue={employee.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          <DesignationField items={designations?.data ?? []} defaultId={employee.designationId ?? ''} />
        </div>
        <div className="sm:col-span-2">
          <AssignableRoleChecks roles={roles?.data ?? []} selectedCodes={employee.roleCodes} />
        </div>
      </div>
      {error ? <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save details'}
      </Button>
    </form>
  );
}
