import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { EmployeeProfile } from '@/features/employees/employee-profile';

export default function SuperAdminEmployeeDetailPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <EmployeeProfile basePath="/super-admin/employees" />
    </Suspense>
  );
}
