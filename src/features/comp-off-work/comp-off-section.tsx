'use client';

import { useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CompOffStatusList } from '@/features/comp-off-work/comp-off-status-list';
import { RequestCompOffForm } from '@/features/comp-off-work/request-comp-off-form';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function CompOffSection() {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const [open, setOpen] = useState(false);

  if (!canApply) return null;

  return (
    <section className="mb-10 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Meta>Compensatory work</Meta>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Offset an approved leave day this month by working a week-off or holiday. HR approval required.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Request compensatory work
        </Button>
      </div>
      <CompOffStatusList />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Compensatory work</DialogTitle>
          <DialogDescription className="sr-only">
            Request compensatory work on a week-off or holiday to offset a leave day.
          </DialogDescription>
          <div className="mt-4">
            <RequestCompOffForm onApplied={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
