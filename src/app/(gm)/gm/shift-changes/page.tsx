'use client';

import { ShiftChangeQueue } from '@/features/shift-changes/shift-change-queue';

export default function GmShiftChangesPage() {
  return (
    <ShiftChangeQueue
      kicker="Attendance"
      title="Shift change requests"
      description="Read-only view of employee shift change requests. HR Manager approves or declines."
    />
  );
}
