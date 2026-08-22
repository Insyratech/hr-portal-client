import { LeaveApplicationsBoard } from '@/features/leave/leave-applications-board';

export default function SuperAdminLeavesPage() {
  return <LeaveApplicationsBoard kicker="Leaves" reviewBase="/super-admin/leaves" />;
}
