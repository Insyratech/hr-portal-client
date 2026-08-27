'use client';

import { useParams } from 'next/navigation';
import { AttendanceReviewCardPage } from '@/features/attendance/attendance-review-card';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function Page() {
  const params = useParams<{ id: string; employeeId: string }>();
  const canManage = useAppSelector((state) => state.permissions.permissions.includes(PERMISSIONS.ATTENDANCE_MANAGE));
  return (
    <AttendanceReviewCardPage
      importId={params.id}
      employeeId={params.employeeId}
      listHref="/gm/attendance"
      canManage={canManage}
    />
  );
}
