'use client';

import { NamedEntityManager } from '@/features/organization/named-entity-manager';
import { useCreateDesignationMutation, useGetDesignationsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function DesignationsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SYSTEM_MANAGE),
  );
  const { data, isFetching, isError } = useGetDesignationsQuery();
  const [createDesignation] = useCreateDesignationMutation();

  return (
    <NamedEntityManager
      kicker="Organization"
      title="Designations"
      items={data?.data ?? []}
      isLoading={isFetching}
      isError={isError}
      canManage={canManage}
      onCreate={(input) => createDesignation(input).unwrap()}
    />
  );
}
