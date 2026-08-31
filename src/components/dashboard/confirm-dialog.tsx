'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { performSignOut } from '@/features/auth/sign-out';
import { closeConfirmDialog } from '@/store/slices/ui-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function ConfirmDialog() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { open, title, description, action } = useAppSelector((state) => state.ui.confirmDialog);
  const [pending, setPending] = useState(false);

  async function onConfirm(): Promise<void> {
    if (pending) {
      return;
    }

    if (action === 'logout') {
      setPending(true);
      try {
        await performSignOut(dispatch);
        dispatch(closeConfirmDialog());
        router.replace('/login');
      } catch {
        dispatch(closeConfirmDialog());
        router.replace('/login');
      } finally {
        setPending(false);
      }
      return;
    }

    dispatch(closeConfirmDialog());
  }

  function onDismiss(): void {
    if (pending) {
      return;
    }
    dispatch(closeConfirmDialog());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onDismiss();
        }
      }}
    >
      <DialogContent showClose={!pending}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onDismiss} disabled={pending}>
            {action === 'logout' ? 'Cancel' : 'Close'}
          </Button>
          {action === 'logout' ? (
            <Button type="button" loading={pending} onClick={() => void onConfirm()}>
              Sign out
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
