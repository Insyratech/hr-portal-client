export type ShellVariant =
  | 'employee'
  | 'admin'
  | 'hr'
  | 'gm'
  | 'cso'
  | 'finance'
  | 'inventory'
  | 'super-admin';

/** Managerial shells that can appear as separate sidebar “Responsibility” blocks. */
export type ManagerialShellVariant = Exclude<ShellVariant, 'employee' | 'super-admin'>;

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

export function isInventoryManager(roles: string[]): boolean {
  return roles.includes('INVENTORY_MANAGER') && !isSuperAdmin(roles);
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
  if (isCso(roles)) return '/cso/work';
  if (isFinanceManager(roles)) return '/finance';
  if (isInventoryManager(roles)) return '/inventory';
  return '/dashboard';
}

/** Primary hat for display — same priority as home / shell. */
export function primaryRoleCode(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (isHrManager(roles)) return 'HR_MANAGER';
  if (isGeneralManager(roles)) return 'GENERAL_MANAGER';
  if (isCso(roles)) return 'CSO';
  if (isFinanceManager(roles)) return 'FINANCE_MANAGER';
  if (isInventoryManager(roles)) return 'INVENTORY_MANAGER';
  if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
  return roles[0] ?? 'EMPLOYEE';
}

export function shellVariantForRoles(roles: string[]): ShellVariant {
  if (roles.includes('SUPER_ADMIN')) return 'super-admin';
  if (isHrManager(roles)) return 'hr';
  if (isGeneralManager(roles)) return 'gm';
  if (isCso(roles)) return 'cso';
  if (isFinanceManager(roles)) return 'finance';
  if (isInventoryManager(roles)) return 'inventory';
  return 'employee';
}

/**
 * Every managerial hat the user holds, in shell priority order.
 * Used so multi-role users get a Responsibility section per hat (e.g. CSO + Inventory).
 */
export function managerialShellVariantsForRoles(roles: string[]): ManagerialShellVariant[] {
  if (roles.includes('SUPER_ADMIN')) return [];
  const variants: ManagerialShellVariant[] = [];
  if (isHrManager(roles)) variants.push('hr');
  if (isGeneralManager(roles)) variants.push('gm');
  if (isCso(roles)) variants.push('cso');
  if (isFinanceManager(roles)) variants.push('finance');
  if (isInventoryManager(roles)) variants.push('inventory');
  return variants;
}

/** Managerial role codes for display (excludes EMPLOYEE; Super Admin alone returns SA). */
export function displayRoleCodes(roles: string[]): string[] {
  if (roles.includes('SUPER_ADMIN')) return ['SUPER_ADMIN'];
  const codes: string[] = [];
  if (isHrManager(roles)) codes.push('HR_MANAGER');
  if (isGeneralManager(roles)) codes.push('GENERAL_MANAGER');
  if (isCso(roles)) codes.push('CSO');
  if (isFinanceManager(roles)) codes.push('FINANCE_MANAGER');
  if (isInventoryManager(roles)) codes.push('INVENTORY_MANAGER');
  if (codes.length > 0) return codes;
  if (roles.includes('EMPLOYEE')) return ['EMPLOYEE'];
  return roles[0] ? [roles[0]] : [];
}

export function isSharedPersonalPath(pathname: string): boolean {
  return (
    pathname === '/more/password' ||
    pathname === '/more/profile' ||
    pathname.startsWith('/leave/handover') ||
    pathname.startsWith('/leave/lead') ||
    pathname.startsWith('/shift-change/lead') ||
    pathname === '/shift-change' ||
    pathname.startsWith('/shift-change/')
  );
}

function isEmployeeWorkspacePath(pathname: string): boolean {
  if (isSharedPersonalPath(pathname)) return false;
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/leave') ||
    pathname.startsWith('/permission') ||
    pathname.startsWith('/shift-change') ||
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/schedule') ||
    pathname.startsWith('/payslips') ||
    pathname.startsWith('/more') ||
    pathname.startsWith('/grievance') ||
    pathname.startsWith('/policies') ||
    pathname.startsWith('/work') ||
    pathname === '/indents' ||
    pathname.startsWith('/indents/') ||
    pathname === '/expense-claims' ||
    pathname.startsWith('/expense-claims/')
  );
}

function isPrivileged(roles: string[]): boolean {
  return (
    roles.includes('SUPER_ADMIN') ||
    isHrManager(roles) ||
    isGeneralManager(roles) ||
    isCso(roles) ||
    isFinanceManager(roles) ||
    isInventoryManager(roles)
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
  if (pathname.startsWith('/inventory')) return isInventoryManager(roles);
  return (
    roles.includes('EMPLOYEE') ||
    isHrManager(roles) ||
    isGeneralManager(roles) ||
    isCso(roles) ||
    isFinanceManager(roles) ||
    isInventoryManager(roles)
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
    'shifts',
    'settings',
    'leaves',
    'permissions',
    'grievances',
  ]);
  const gmOwned = new Set(['attendance', 'payroll', 'reports', 'leave-status', 'holidays']);
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
