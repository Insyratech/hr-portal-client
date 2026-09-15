'use client';

import { EmployeeDirectory } from '@/features/employees/employee-directory';

export default function Page() {
  return (
    <EmployeeDirectory
      basePath="/hr/employees"
      kicker="Employees"
      title="Directory"
      description="Set company, shift, leave, and pay on each profile (no unlock needed). For name, phone, or joining date changes, request an edit from Super Admin."
      rowAction="edit"
    />
  );
}
