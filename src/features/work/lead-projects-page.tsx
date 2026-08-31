'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useGetLeadProjectsQuery } from '@/store/api/api';

export function LeadProjectsPage() {
  const { data, isLoading } = useGetLeadProjectsQuery();
  const projects = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader kicker="My project" title="Project desk" />
      <p className="max-w-2xl text-sm text-muted">
        Projects where you are the current project lead. Open a desk to post status updates, see members, this week’s
        priorities, and related daily work. Approve weekly priorities from Team priorities or on each project desk. Leave approvals for your projects
        appear under Leave.
      </p>
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'members', header: 'Members', cell: (row) => String(row.memberCount) },
          {
            id: 'open',
            header: '',
            cell: (row) => (
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={`/work/projects/${row.id}`}>Open desk</Link>
              </Button>
            ),
          },
        ]}
        rows={projects.map((row) => ({ ...row, id: row.id }))}
        loading={isLoading}
        emptyTitle="No lead projects"
        emptyDescription="When CSO assigns you as project lead on an active project, it appears here. If you were just assigned, refresh the page or sign out and back in. Ask CSO to open Projects → Assign people and save again if it still does not show."
      />
    </div>
  );
}
