'use client';

import { useGetLeadProjectsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

/** True when the signed-in employee is lead on at least one active project. */
export function useIsProjectLead() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isFetching, isError, refetch } = useGetLeadProjectsQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const projects = data?.data ?? [];

  return {
    isProjectLead: projects.length > 0,
    projects,
    isLoading: Boolean(user) && (isLoading || isFetching),
    isError,
    refetch,
  };
}
