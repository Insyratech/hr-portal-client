'use client';

import { ShiftChangeQueue } from '@/features/shift-changes/shift-change-queue';

export default function HrShiftChangesPage() {
  return (
    <ShiftChangeQueue
      kicker="Operations"
      title="Shift change requests"
      description="Review pending requests after project-lead approval when required. Approved changes apply only to the requested day(s); the employee’s normal shift stays for all other days."
    />
  );
}
