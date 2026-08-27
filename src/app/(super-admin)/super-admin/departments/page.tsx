'use client';

import { NamedEntityManager } from '@/features/organization/named-entity-manager';
import { useCreateDepartmentMutation, useGetDepartmentsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function DepartmentsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SYSTEM_MANAGE),
  );
  const { data, isFetching, isError } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();

  return (
    <NamedEntityManager
      kicker="Organization"
      title="Departments"
      items={data?.data ?? []}
      isLoading={isFetching}
      isError={isError}
      canManage={canManage}
      onCreate={(input) => createDepartment(input).unwrap()}
    />
  );
}
