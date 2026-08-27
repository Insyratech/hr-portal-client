'use client';

import { useParams } from 'next/navigation';
import { AttendanceImportReview } from '@/features/attendance/attendance-import-review';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function Page() {
  const params = useParams<{ id: string }>();
  const canManage = useAppSelector((state) => state.permissions.permissions.includes(PERMISSIONS.ATTENDANCE_MANAGE));
  return <AttendanceImportReview importId={params.id} listHref="/gm/attendance" canManage={canManage} />;
}
