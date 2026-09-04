import type { Role } from '@/types/api';
import { Meta } from '@/components/layout/meta';

/** Managerial hats Super Admin may assign on a profile (Phase B). Create always uses Employee only. */
export const SA_ASSIGNABLE_ROLE_CODES = new Set([
  'EMPLOYEE',
  'HR_MANAGER',
  'GENERAL_MANAGER',
  'CSO',
  'FINANCE_MANAGER',
]);

/** Managerial hats shown as checkboxes (Employee is always kept server-side). */
export const MANAGERIAL_ROLE_CODES = new Set([
  'HR_MANAGER',
  'GENERAL_MANAGER',
  'CSO',
  'FINANCE_MANAGER',
]);

/** @deprecated Use SA_ASSIGNABLE_ROLE_CODES. */
export const ONBOARDING_ROLE_CODES = SA_ASSIGNABLE_ROLE_CODES;

export function roleLabel(code: string): string {
  switch (code) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'HR_MANAGER':
      return 'HR Manager';
    case 'GENERAL_MANAGER':
      return 'General Manager';
    case 'CSO':
      return 'Chief Scientific Officer';
    case 'FINANCE_MANAGER':
      return 'Finance Manager';
    case 'EMPLOYEE':
      return 'Employee';
    case 'ADMIN':
      return 'General Manager (legacy)';
    default:
      return code;
  }
}

/** @deprecated Prefer EmployeeAccessRoles on the profile. Kept for catalog helpers. */
export function AssignableRoleChecks({
  roles,
  selectedCodes,
  single = false,
}: {
  roles: Role[];
  selectedCodes: string[];
  single?: boolean;
}) {
  const assignable = roles.filter((item) => MANAGERIAL_ROLE_CODES.has(item.code));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 block text-xs uppercase tracking-[0.2em] text-meta" style={{ color: 'var(--meta)' }}>
        Access roles
      </legend>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked disabled readOnly />
        Employee (always on)
      </label>
      {assignable.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <input
            type={single ? 'radio' : 'checkbox'}
            name="roleIds"
            value={item.id}
            defaultChecked={selectedCodes.includes(item.code)}
          />
          {roleLabel(item.code)}
        </label>
      ))}
      <Meta>Keep Employee. Add HR / GM / CSO / Finance as needed. Super Admin cannot be assigned here.</Meta>
    </fieldset>
  );
}
