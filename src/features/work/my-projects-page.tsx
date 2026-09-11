'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useMyProjects } from '@/features/work/my-projects';
import { ProjectMembersCountButton } from '@/features/work/project-members-card';

export function MyProjectsPage() {
  const { projects, isLoading, isProjectLead } = useMyProjects();

  return (
    <div className="space-y-6">
      <PageHeader kicker="My project" title={isProjectLead ? 'Project desk' : 'My projects'} />
      <p className="max-w-2xl text-sm text-muted">
        Every active project you are part of. On projects you lead, open the desk to post status updates, see
        members, this week’s priorities, and related daily work. On the others you have read access to the goals
        and milestones the project lead maintains. Click a member count to see who is on the project and who leads
        it.
      </p>
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'role', header: 'My role', cell: (row) => (row.isLead ? 'Lead' : 'Member') },
          { id: 'lead', header: 'Project lead', cell: (row) => row.leadName ?? '—' },
          {
            id: 'members',
            header: 'Members',
            cell: (row) => (
              <ProjectMembersCountButton
                project={{
                  name: row.name,
                  code: row.code,
                  leadEmployeeId: row.leadEmployeeId,
                  leadName: row.leadName,
                  members: row.members,
                  memberCount: row.memberCount,
                }}
              />
            ),
          },
          {
            id: 'open',
            header: '',
            cell: (row) => (
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={`/work/projects/${row.id}`}>{row.isLead ? 'Open desk' : 'View project'}</Link>
              </Button>
            ),
          },
        ]}
        rows={projects}
        loading={isLoading}
        emptyTitle="No projects yet"
        emptyDescription="When CSO adds you to an active project, it appears here. If you were just added, refresh the page or sign out and back in. Ask CSO to open Projects → Assign people and save again if it still does not show."
      />
    </div>
  );
}
