'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { useIsProjectLead } from '@/features/work/project-lead';

export function ProjectLeadGuard({ children }: { children: ReactNode }) {
  const { isProjectLead, isLoading } = useIsProjectLead();

  if (isLoading) {
    return <PageLoading compact message="Loading your projects…" />;
  }

  if (!isProjectLead) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="My project" title="Project lead only" />
        <p className="max-w-xl text-sm text-muted">
          This page is for the current lead of an active project. When CSO assigns you as project lead,
          <span className="text-foreground"> My project</span> appears with Project desk, Team priorities, and
          Team permissions.
        </p>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work">Back to My work</Link>
        </Button>
      </div>
    );
  }

  return children;
}
