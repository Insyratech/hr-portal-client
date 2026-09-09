'use client';

import { MEMBER_PROJECT_NAV, MY_PROJECT_NAV, type NavItem } from '@/constants/nav';
import { useGetMyProjectsQuery } from '@/store/api/api';
import type { MyProjectSummary } from '@/types/api';
import { useAppSelector } from '@/store/hooks';

/** Every active project the signed-in employee belongs to — led projects plus read-only memberships. */
export function useMyProjects() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isFetching, isError, refetch } = useGetMyProjectsQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const projects = data?.data ?? [];
  const leadProjects = projects.filter((project) => project.isLead);

  return {
    projects,
    leadProjects,
    isProjectLead: leadProjects.length > 0,
    hasProjects: projects.length > 0,
    isLoading: Boolean(user) && (isLoading || isFetching),
    isError,
    refetch,
  };
}

export function findMyProject(
  projects: MyProjectSummary[],
  projectId: string,
): MyProjectSummary | null {
  return projects.find((project) => project.id === projectId) ?? null;
}

/** Leads get the full project toolset; plain members only get the read-only project list. */
export function myProjectNavItems(isProjectLead: boolean): readonly NavItem[] {
  return isProjectLead ? MY_PROJECT_NAV : MEMBER_PROJECT_NAV;
}

/** Nav items for the "My project" area, or an empty list when the employee has no project. */
export function useMyProjectNavItems(): readonly NavItem[] {
  const { hasProjects, isProjectLead } = useMyProjects();
  if (!hasProjects) return [];
  return myProjectNavItems(isProjectLead);
}
