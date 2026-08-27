'use client';

import { useParams } from 'next/navigation';
import { AttendanceImportReview } from '@/features/attendance/attendance-import-review';

export default function SuperAdminAttendanceImportPage() {
  const params = useParams<{ id: string }>();
  return <AttendanceImportReview importId={params.id} listHref="/super-admin/attendance" canManage={false} />;
}
