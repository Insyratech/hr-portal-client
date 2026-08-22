import { LeaveApplicationsBoard } from '@/features/leave/leave-applications-board';

export default function AdminLeavesPage() {
  return <LeaveApplicationsBoard kicker="Leaves" reviewBase="/admin/leaves" />;
}
