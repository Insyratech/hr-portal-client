'use client';

import { useParams } from 'next/navigation';
import { AttendanceReviewCardPage } from '@/features/attendance/attendance-review-card';

export default function SuperAdminAttendanceCardPage() {
  const params = useParams<{ id: string; employeeId: string }>();
  return (
    <AttendanceReviewCardPage
      importId={params.id}
      employeeId={params.employeeId}
      listHref="/super-admin/attendance"
      canManage={false}
    />
  );
}
