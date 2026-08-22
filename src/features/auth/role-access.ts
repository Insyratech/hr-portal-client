export type ShellVariant = 'employee' | 'admin' | 'super-admin';

export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return null;
  }
  return value;
}

export function homePathForRoles(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) {
    return '/super-admin';
  }
  if (roles.includes('ADMIN')) {
    return '/admin';
  }
  return '/dashboard';
}

export function shellVariantForRoles(roles: string[]): ShellVariant {
  if (roles.includes('SUPER_ADMIN')) {
    return 'super-admin';
  }
  if (roles.includes('ADMIN')) {
    return 'admin';
  }
  return 'employee';
}

export function isSharedPersonalPath(pathname: string): boolean {
  return pathname === '/more/password' || pathname.startsWith('/leave/handover');
}

function isEmployeeWorkspacePath(pathname: string): boolean {
  if (isSharedPersonalPath(pathname)) {
    return false;
  }
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/leave') ||
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/more') ||
    pathname.startsWith('/grievance') ||
    pathname.startsWith('/policies')
  );
}

export function isPathAllowed(roles: string[], pathname: string): boolean {
  if (pathname === '/more/password') {
    return roles.length > 0;
  }
  if (pathname.startsWith('/super-admin')) {
    return roles.includes('SUPER_ADMIN');
  }
  if (pathname.startsWith('/admin')) {
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }
  return roles.includes('EMPLOYEE') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

export function destinationAfterLogin(roles: string[], nextParam: string | null): string {
  const next = safeInternalPath(nextParam);
  if (!next || !isPathAllowed(roles, next)) {
    return homePathForRoles(roles);
  }
  const privileged = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  if (privileged && isEmployeeWorkspacePath(next)) {
    return homePathForRoles(roles);
  }
  return next;
}
