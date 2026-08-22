'use client';

import { NamedEntityManager } from '@/features/organization/named-entity-manager';
import { useCreateDesignationMutation, useGetDesignationsQuery } from '@/store/api/api';

export default function DesignationsPage() {
  const { data, isFetching, isError } = useGetDesignationsQuery();
  const [createDesignation] = useCreateDesignationMutation();

  return (
    <NamedEntityManager
      kicker="Organization"
      title="Designations"
      items={data?.data ?? []}
      isLoading={isFetching}
      isError={isError}
      onCreate={(input) => createDesignation(input).unwrap()}
    />
  );
}
