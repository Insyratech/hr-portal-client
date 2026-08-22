import type { Role } from '@/types/api';
import { Meta } from '@/components/layout/meta';

export const ONBOARDING_ROLE_CODES = new Set(['EMPLOYEE', 'ADMIN']);

export function roleLabel(code: string): string {
  return code === 'ADMIN' ? 'HR manager (Admin)' : 'Employee';
}

export function AssignableRoleChecks({
  roles,
  selectedCodes,
}: {
  roles: Role[];
  selectedCodes: string[];
}) {
  const assignable = roles.filter((item) => ONBOARDING_ROLE_CODES.has(item.code));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Access roles</legend>
      {assignable.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="roleIds"
            value={item.id}
            defaultChecked={selectedCodes.includes(item.code)}
          />
          {roleLabel(item.code)}
        </label>
      ))}
      <Meta>You can assign both. Employee is self-service; HR manager can run HR operations. Super Admin cannot be assigned here.</Meta>
    </fieldset>
  );
}
