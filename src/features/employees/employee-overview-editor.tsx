'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { DesignationField, resolveDesignationId } from '@/features/employees/designation-field';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const departmentId = String(form.get('departmentId') ?? '');
    const phone = String(form.get('phone') ?? '');

    try {
      const designationId = (await resolveDesignationId(form, (input) => createDesignation(input).unwrap())) ?? null;
      await updateEmployee({
        id: employee.id,
        body: {
          employeeCode: String(form.get('employeeCode') ?? ''),
          fullName: String(form.get('fullName') ?? ''),
          phone: phone || null,
          departmentId: departmentId || null,
          designationId,
          joiningDate: dateInputValue(String(form.get('joiningDate') ?? '')),
          employmentType: String(form.get('employmentType') ?? 'full_time'),
        },
      }).unwrap();
      toast.success('Employee details saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save employee.'));
    }
  }

  return (
    <form key={employee.updatedAt} onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <Meta>Edit personal details</Meta>
      <p className="text-sm text-muted">
        Company, shift, leave, and pay are set by HR Manager — not here. Login email cannot be changed.
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
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={employee.email} disabled readOnly />
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
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save details'}
      </Button>
    </form>
  );
}
