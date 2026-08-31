'use client';

import { LeadProjectsPage } from '@/features/work/lead-projects-page';
import { ProjectLeadGuard } from '@/features/work/project-lead-guard';

export default function Page() {
  return (
    <ProjectLeadGuard>
      <LeadProjectsPage />
    </ProjectLeadGuard>
  );
}
