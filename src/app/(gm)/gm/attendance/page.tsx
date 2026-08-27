'use client';

import { AttendanceImportHub } from '@/features/attendance/attendance-import-hub';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function Page() {
  const canManage = useAppSelector((state) => state.permissions.permissions.includes(PERMISSIONS.ATTENDANCE_MANAGE));
  return <AttendanceImportHub listHref="/gm/attendance" canManage={canManage} />;
}
