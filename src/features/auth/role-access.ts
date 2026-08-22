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

export function isPathAllowed(roles: string[], pathname: string): boolean {
  // Any signed-in user may change their own login password.
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
