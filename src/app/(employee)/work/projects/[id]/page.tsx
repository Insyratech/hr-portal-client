'use client';

import { useParams } from 'next/navigation';
import { PageLoading } from '@/components/ui/page-loading';
import { LeadProjectDeskPage } from '@/features/work/lead-project-desk-page';
import { MemberProjectViewPage } from '@/features/work/member-project-view-page';
import { findMyProject, useMyProjects } from '@/features/work/my-projects';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { projects, isLoading } = useMyProjects();

  if (!id) return <p className="text-sm text-muted">Project not found.</p>;
  if (isLoading) return <PageLoading compact message="Loading project…" />;

  return findMyProject(projects, id)?.isLead ? (
    <LeadProjectDeskPage projectId={id} />
  ) : (
    <MemberProjectViewPage projectId={id} />
  );
}
