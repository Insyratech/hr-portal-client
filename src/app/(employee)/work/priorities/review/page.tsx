'use client';

import { AdminWorkPrioritiesPage } from '@/features/work/admin-work-priorities-page';
import { ProjectLeadGuard } from '@/features/work/project-lead-guard';

export default function Page() {
  return (
    <ProjectLeadGuard>
      <AdminWorkPrioritiesPage canApprove deskMode="lead" />
    </ProjectLeadGuard>
  );
}
