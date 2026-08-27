'use client';

import { WorkingDaysSettings } from '@/features/organization/working-days-settings';
import { WorkRetentionSettings } from '@/features/work/work-retention-settings';

export default function SuperAdminSettingsPage() {
  return (
    <>
      <WorkingDaysSettings />
      <WorkRetentionSettings />
    </>
  );
}
