import { Suspense } from 'react';
import { EmployeeProfile } from '@/features/employees/employee-profile';

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading</p>}>
      <EmployeeProfile />
    </Suspense>
  );
}
