'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PermissionStatusList } from '@/features/work-permissions/permission-status';
import { RequestPermissionForm } from '@/features/work-permissions/request-permission-form';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

function PermissionPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissionId = searchParams.get('permissionId');
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_PERMISSION_APPLY),
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('apply') !== '1') return;
    setOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete('apply');
    const query = next.toString();
    router.replace(query ? `/permission?${query}` : '/permission');
  }, [router, searchParams]);

  return (
    <>
      <PageHeader kicker="Permission" title="Permission" />
      <PermissionStatusList focusId={permissionId} />
      {canApply ? (
        <Button type="button" onClick={() => setOpen(true)}>
          Apply for permission
        </Button>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Request permission</DialogTitle>
          <DialogDescription className="sr-only">
            Request 1 hour at the start or end of your shift.
          </DialogDescription>
          <div className="mt-4">
            <RequestPermissionForm onApplied={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PermissionPage() {
  return (
    <Suspense>
      <PermissionPageBody />
    </Suspense>
  );
}
