'use client';

import { useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CompOffStatusList } from '@/features/comp-off-work/comp-off-status-list';
import { RequestCompOffAdjustForm } from '@/features/comp-off-work/request-comp-off-adjust-form';
import { RequestCompOffForm } from '@/features/comp-off-work/request-comp-off-form';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function CompOffSection() {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const [workOpen, setWorkOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  if (!canApply) return null;

  return (
    <section className="mb-10 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Meta>Compensatory work</Meta>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Earn COMP leave by working a week-off or holiday (project lead then HR). Apply COMP from Apply leave, or
            adjust a leave day already taken this month.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setAdjustOpen(true)}>
            Adjust leave this month
          </Button>
          <Button type="button" variant="outline" onClick={() => setWorkOpen(true)}>
            Request compensatory work
          </Button>
        </div>
      </div>
      <CompOffStatusList />
      <Dialog open={workOpen} onOpenChange={setWorkOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Compensatory work</DialogTitle>
          <DialogDescription className="sr-only">
            Request permission to work on a week-off or holiday to earn compensatory leave.
          </DialogDescription>
          <div className="mt-4">
            <RequestCompOffForm onApplied={() => setWorkOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Adjust leave against COMP</DialogTitle>
          <DialogDescription className="sr-only">
            Cover an approved leave day already taken this month using compensatory leave.
          </DialogDescription>
          <div className="mt-4">
            <RequestCompOffAdjustForm onApplied={() => setAdjustOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
