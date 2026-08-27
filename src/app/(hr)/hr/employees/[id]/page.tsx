import { Suspense } from 'react';
import { EmployeeProfile } from '@/features/employees/employee-profile';

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading</p>}>
      <EmployeeProfile basePath="/hr/employees" />
    </Suspense>
  );
}
