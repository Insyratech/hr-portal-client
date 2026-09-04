'use client';

import { ProjectLeadGuard } from '@/features/work/project-lead-guard';
import { TeamPermissionsPage } from '@/features/work/team-permissions-page';

export default function Page() {
  return (
    <ProjectLeadGuard>
      <TeamPermissionsPage />
    </ProjectLeadGuard>
  );
}
