'use client';

import { EmployeeDirectory } from '@/features/employees/employee-directory';

export default function Page() {
  return (
    <EmployeeDirectory
      basePath="/gm/employees"
      kicker="People"
      title="Employees"
      description="Read-only directory for both companies. Open a person for profile, compensation, bank, attendance, and leave details. HR Manager maintains these records."
      filterByCompany
    />
  );
}
