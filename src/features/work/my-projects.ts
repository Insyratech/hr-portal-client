'use client';

import { MEMBER_PROJECT_NAV, MY_PROJECT_NAV, type NavItem } from '@/constants/nav';
import { useGetMyProjectsQuery } from '@/store/api/api';
import type { MyProjectSummary } from '@/types/api';
import { useAppSelector } from '@/store/hooks';

/** Stable identity so consumers re-render only when the project list actually changes. */
const NO_PROJECTS: MyProjectSummary[] = [];

/**
 * Every active project the signed-in employee belongs to — led projects plus read-only memberships.
 *
 * Several components subscribe to this at once (nav, page shell, page body). `isLoading` therefore
 * reports the first load only, never a background refetch: gating a parent on `isFetching` would
 * unmount its children mid-refetch, and remounting a child re-subscribes, which would kick off
 * another refetch and loop forever.
 */
export function useMyProjects() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError } = useGetMyProjectsQuery(undefined, { skip: !user });
  const projects = data?.data ?? NO_PROJECTS;

  return {
    projects,
    isProjectLead: projects.some((project) => project.isLead),
    hasProjects: projects.length > 0,
    isLoading: Boolean(user) && isLoading,
    isError,
  };
}

export function findMyProject(
  projects: readonly MyProjectSummary[],
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
