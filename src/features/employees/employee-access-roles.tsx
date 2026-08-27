'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Meta } from '@/components/layout/meta';
import { MANAGERIAL_ROLE_CODES, roleLabel } from '@/features/employees/onboarding-roles';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useGetRolesQuery, useUpdateEmployeeRolesMutation } from '@/store/api/api';
import type { Employee } from '@/types/api';

function managerialCodesFrom(roleCodes: string[]): string[] {
  return roleCodes.filter((code) => MANAGERIAL_ROLE_CODES.has(code)).sort();
}

export function EmployeeAccessRoles({ employee }: { employee: Employee }) {
  const toast = useToast();
  const { data: roleCatalog, isError: rolesError } = useGetRolesQuery();
  const [updateRoles, { isLoading }] = useUpdateEmployeeRolesMutation();
  const managerialRoles = useMemo(
    () => (roleCatalog?.data ?? []).filter((item) => MANAGERIAL_ROLE_CODES.has(item.code)),
    [roleCatalog?.data],
  );
  const roleSyncKey = `${employee.id}:${employee.updatedAt}:${[...employee.roleCodes].sort().join(',')}`;
  const [selected, setSelected] = useState(() => managerialCodesFrom(employee.roleCodes));

  useEffect(() => {
    setSelected(managerialCodesFrom(employee.roleCodes));
  }, [roleSyncKey, employee.roleCodes]);

  const dirty =
    managerialCodesFrom(employee.roleCodes).join(',') !== [...selected].sort().join(',');

  function toggle(code: string) {
    setSelected((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function onSave() {
    const idByCode = new Map(managerialRoles.map((item) => [item.code, item.id]));
    const roleIds = selected
      .map((code) => idByCode.get(code))
      .filter((id): id is string => Boolean(id));

    if (roleIds.length !== selected.length) {
      toast.error('A selected access role is missing. Ask support to seed roles.');
      return;
    }

    try {
      await updateRoles({ id: employee.id, roleIds }).unwrap();
      toast.success('Access roles saved. The employee will get an alert and email.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save access roles.'));
    }
  }

  if (employee.roleCodes.includes('SUPER_ADMIN')) {
    return null;
  }

  return (
    <section id="access-roles" className="mb-8 max-w-2xl space-y-4 rounded border border-border bg-background p-5 shadow-card">
      <div>
        <Meta>Access roles</Meta>
        <p className="mt-1 text-sm text-muted">
          Job title (designation) is separate from portal access. Assign HR / GM / CSO / Finance here — no directory
          unlock needed. Queues stay with the role (a new HR sees existing leave and grievances).
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked disabled readOnly />
        Employee (always on)
      </label>

      {rolesError ? <p className="text-sm">Unable to load roles.</p> : null}

      <div className="space-y-2">
        {managerialRoles.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(item.code)}
              onChange={() => toggle(item.code)}
            />
            {roleLabel(item.code)}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onSave} disabled={isLoading || !dirty}>
          {isLoading ? 'Saving…' : 'Save access roles'}
        </Button>
        {dirty ? (
          <button
            type="button"
            className="text-sm text-muted underline"
            onClick={() => setSelected(managerialCodesFrom(employee.roleCodes))}
          >
            Reset
          </button>
        ) : null}
      </div>
    </section>
  );
}
