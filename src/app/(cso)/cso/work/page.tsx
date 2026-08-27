'use client';

import { AdminWorkPage } from '@/features/work/admin-work-page';

export default function Page() {
  return (
    <AdminWorkPage
      employeeHref={(id) => `/cso/work/priorities?employeeId=${encodeURIComponent(id)}`}
    />
  );
}
