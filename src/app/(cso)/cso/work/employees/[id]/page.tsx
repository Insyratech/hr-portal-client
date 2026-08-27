'use client';

import { useParams } from 'next/navigation';
import { CsoEmployeeDetailPage } from '@/features/work/cso-employee-detail-page';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  if (!id) return <p className="text-sm text-muted">Missing employee.</p>;
  return <CsoEmployeeDetailPage employeeId={id} />;
}
