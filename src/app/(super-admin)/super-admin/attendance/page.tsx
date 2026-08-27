'use client';

import { AttendanceImportHub } from '@/features/attendance/attendance-import-hub';

export default function SuperAdminAttendancePage() {
  return <AttendanceImportHub listHref="/super-admin/attendance" canManage={false} />;
}
