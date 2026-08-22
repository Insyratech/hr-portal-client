import { PageHeader } from '@/components/layout/page-header';
import { CreateEmployeeForm } from '@/features/employees/create-employee-form';

export default function SuperAdminNewEmployeePage() {
  return (
    <>
      <PageHeader kicker="Organization" title="New employee" />
      <CreateEmployeeForm basePath="/super-admin/employees" />
    </>
  );
}
