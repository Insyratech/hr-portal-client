import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    const saHome = '/super-admin';
    const saDomainPages = [
      'companies',
      'departments',
      'designations',
      'leave-types',
      'leave-policies',
      'holidays',
      'shifts',
      'attendance',
      'payroll',
      'reports',
      'leaves',
      'grievances',
      'permissions',
      'work',
    ];

    // Legacy /admin/* → role-owned portals (ADMIN became GENERAL_MANAGER; org/leave moved to HR).
    const adminToHr = [
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
    ];
    const adminToGm = ['attendance', 'payroll', 'reports', 'leave-status'];
    const adminToCso = ['work'];

    return [
      { source: '/admin/leave-policies', destination: '/hr/leave-types', permanent: false },
      { source: '/admin/leave-policies/:path*', destination: '/hr/leave-types', permanent: false },
      { source: '/admin/policies', destination: '/policies', permanent: false },
      { source: '/admin/policies/:path*', destination: '/policies', permanent: false },
      ...adminToHr.flatMap((path) => [
        { source: `/admin/${path}`, destination: `/hr/${path}`, permanent: false },
        { source: `/admin/${path}/:path*`, destination: `/hr/${path}/:path*`, permanent: false },
      ]),
      ...adminToGm.flatMap((path) => [
        { source: `/admin/${path}`, destination: `/gm/${path}`, permanent: false },
        { source: `/admin/${path}/:path*`, destination: `/gm/${path}/:path*`, permanent: false },
      ]),
      ...adminToCso.flatMap((path) => [
        { source: `/admin/${path}`, destination: `/cso/${path}`, permanent: false },
        { source: `/admin/${path}/:path*`, destination: `/cso/${path}/:path*`, permanent: false },
      ]),
      { source: '/admin', destination: '/gm', permanent: false },
      { source: '/admin/:path*', destination: '/gm/:path*', permanent: false },
      ...saDomainPages.flatMap((path) => [
        { source: `/super-admin/${path}`, destination: saHome, permanent: false },
        { source: `/super-admin/${path}/:path*`, destination: saHome, permanent: false },
      ]),
    ];
  },
};

export default nextConfig;
