import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { EmployeeProfile } from '@/features/employees/employee-profile';

export default function Page() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <EmployeeProfile basePath="/hr/employees" />
    </Suspense>
  );
}
