'use client';

import { useParams } from 'next/navigation';
import { LeadProjectDeskPage } from '@/features/work/lead-project-desk-page';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  if (!id) return <p className="text-sm text-muted">Project not found.</p>;
  return <LeadProjectDeskPage projectId={id} />;
}
