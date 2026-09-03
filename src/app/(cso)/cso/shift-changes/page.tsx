'use client';

import { ShiftChangeQueue } from '@/features/shift-changes/shift-change-queue';

export default function CsoShiftChangesPage() {
  return (
    <ShiftChangeQueue
      kicker="Team"
      title="Shift change requests"
      description="Read-only org view of shift change requests. Project leads approve their step from My shift change; HR makes the final decision."
    />
  );
}
