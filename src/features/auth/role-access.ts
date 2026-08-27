export type ShellVariant = 'employee' | 'admin' | 'hr' | 'gm' | 'cso' | 'finance' | 'super-admin';

export function isSuperAdmin(roles: string[]): boolean {
  return roles.includes('SUPER_ADMIN');
}

export function isGeneralManager(roles: string[]): boolean {
  return (roles.includes('GENERAL_MANAGER') || roles.includes('ADMIN')) && !isSuperAdmin(roles);
}

export function isHrManager(roles: string[]): boolean {
  return roles.includes('HR_MANAGER') && !isSuperAdmin(roles);
}

export function isCso(roles: string[]): boolean {
  return roles.includes('CSO') && !isSuperAdmin(roles);
}

export function isFinanceManager(roles: string[]): boolean {
  return roles.includes('FINANCE_MANAGER') && !isSuperAdmin(roles);
}

/** @deprecated Use isGeneralManager. */
export function isHrAdmin(roles: string[]): boolean {
  return isGeneralManager(roles);
}

export function canLifecycleDirectoryRecord(
  actorRoles: string[],
  actorEmployeeId: string | undefined,
  target: { id: string; roleCodes: string[] },
): boolean {
  if (!actorEmployeeId || target.id === actorEmployeeId) {
    return false;
  }
  if (target.roleCodes.includes('SUPER_ADMIN')) {
    return false;
  }
  return isSuperAdmin(actorRoles);
}

/** Phase 5: Super Admin may edit when an approved unlock is active for this employee. */
export function canEditDirectoryRecord(
  actorRoles: string[],
  targetRoleCodes: string[],
  unlocked = false,
): boolean {
  if (targetRoleCodes.includes('SUPER_ADMIN')) {
    return false;
  }
  return isSuperAdmin(actorRoles) && unlocked;
}

export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return null;
  }
  return value;
}

export function homePathForRoles(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return '/super-admin';
  if (isHrManager(roles)) return '/hr';
  if (isGeneralManager(roles)) return '/gm';
  if (isCso(roles)) return '/cso';
  if (isFinanceManager(roles)) return '/finance';
  return '/dashboard';
}

/** Primary hat for display — same priority as home / shell. */
export function primaryRoleCode(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (isHrManager(roles)) return 'HR_MANAGER';
  if (isGeneralManager(roles)) return 'GENERAL_MANAGER';
  if (isCso(roles)) return 'CSO';
  if (isFinanceManager(roles)) return 'FINANCE_MANAGER';
  if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
  return roles[0] ?? 'EMPLOYEE';
}

export function shellVariantForRoles(roles: string[]): ShellVariant {
  if (roles.includes('SUPER_ADMIN')) return 'super-admin';
  if (isHrManager(roles)) return 'hr';
  if (isGeneralManager(roles)) return 'gm';
  if (isCso(roles)) return 'cso';
  if (isFinanceManager(roles)) return 'finance';
  return 'employee';
}

export function isSharedPersonalPath(pathname: string): boolean {
  return pathname === '/more/password' || pathname.startsWith('/leave/handover');
}

function isEmployeeWorkspacePath(pathname: string): boolean {
  if (isSharedPersonalPath(pathname)) return false;
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/leave') ||
    pathname.startsWith('/permission') ||
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/payslips') ||
    pathname.startsWith('/more') ||
    pathname.startsWith('/grievance') ||
    pathname.startsWith('/policies') ||
    pathname.startsWith('/work')
  );
}

function isPrivileged(roles: string[]): boolean {
  return (
    roles.includes('SUPER_ADMIN') ||
    isHrManager(roles) ||
    isGeneralManager(roles) ||
    isCso(roles) ||
    isFinanceManager(roles)
  );
}

export function isPathAllowed(roles: string[], pathname: string): boolean {
  if (pathname === '/more/password') return roles.length > 0;
  if (roles.includes('SUPER_ADMIN')) {
    // Admin-only account: oversee the system — not employee self-service.
    return pathname.startsWith('/super-admin');
  }
  if (pathname.startsWith('/super-admin')) return false;
  if (pathname.startsWith('/hr')) return isHrManager(roles);
  if (pathname.startsWith('/gm')) return isGeneralManager(roles);
  if (pathname.startsWith('/admin')) {
    // Legacy bookmarks; prefer rewriteLegacyAdminPath before using this.
    return isGeneralManager(roles);
  }
  if (pathname.startsWith('/cso')) return isCso(roles);
  if (pathname.startsWith('/finance')) return isFinanceManager(roles);
  return (
    roles.includes('EMPLOYEE') ||
    isHrManager(roles) ||
    isGeneralManager(roles) ||
    isCso(roles) ||
    isFinanceManager(roles)
  );
}

/** Map old /admin/* bookmarks to the portal that owns that surface. */
export function rewriteLegacyAdminPath(pathname: string): string {
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
    return pathname;
  }
  const rest = pathname.slice('/admin'.length);
  const segment = rest.split('/').filter(Boolean)[0] ?? '';
  if (!segment) return '/gm';

  const hrOwned = new Set([
    'employees',
    'companies',
    'departments',
    'designations',
    'leave-types',
    'holidays',
    'shifts',
    'settings',
    'leaves',
    'permissions',
    'grievances',
  ]);
  const gmOwned = new Set(['attendance', 'payroll', 'reports', 'leave-status']);
  const csoOwned = new Set(['work']);

  if (segment === 'leave-policies') return '/hr/leave-types';
  if (segment === 'policies') return '/policies';
  if (hrOwned.has(segment)) return `/hr${rest}`;
  if (gmOwned.has(segment)) return `/gm${rest}`;
  if (csoOwned.has(segment)) return `/cso${rest}`;
  return `/gm${rest}`;
}

export function destinationAfterLogin(roles: string[], nextParam: string | null): string {
  const raw = safeInternalPath(nextParam);
  const next = raw ? rewriteLegacyAdminPath(raw) : null;
  if (!next || !isPathAllowed(roles, next)) {
    return homePathForRoles(roles);
  }
  if (isPrivileged(roles) && isEmployeeWorkspacePath(next)) {
    // CSO still does the personal work loop — honor /work deep-links from mail & alerts.
    if (isCso(roles) && (next === '/work' || next.startsWith('/work/'))) {
      return next;
    }
    return homePathForRoles(roles);
  }
  return next;
}
