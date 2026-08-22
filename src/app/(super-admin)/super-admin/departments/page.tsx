'use client';

import { NamedEntityManager } from '@/features/organization/named-entity-manager';
import { useCreateDepartmentMutation, useGetDepartmentsQuery } from '@/store/api/api';

export default function DepartmentsPage() {
  const { data, isFetching, isError } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();

  return (
    <NamedEntityManager
      kicker="Organization"
      title="Departments"
      items={data?.data ?? []}
      isLoading={isFetching}
      isError={isError}
      onCreate={(input) => createDepartment(input).unwrap()}
    />
  );
}
