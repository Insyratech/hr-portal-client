'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { clearPasswordAuth } from '@/lib/session-policy';
import { unregisterWebPush } from '@/features/notifications/web-push-bootstrap';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { closeConfirmDialog } from '@/store/slices/ui-slice';
import { clearSession } from '@/store/slices/auth-slice';
import { clearPermissions } from '@/store/slices/permissions-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function ConfirmDialog() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { open, title, description, action } = useAppSelector((state) => state.ui.confirmDialog);

  async function onConfirm(): Promise<void> {
    if (action === 'logout') {
      await unregisterWebPush(dispatch);
      if (isSupabaseBrowserConfigured()) {
        await getSupabaseBrowserClient().auth.signOut();
      }
      clearPasswordAuth();
      dispatch(clearPermissions());
      dispatch(clearSession());
      dispatch(closeConfirmDialog());
      router.replace('/login');
      return;
    }

    dispatch(closeConfirmDialog());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dispatch(closeConfirmDialog());
        }
      }}
    >
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => dispatch(closeConfirmDialog())}>
            {action === 'logout' ? 'Cancel' : 'Close'}
          </Button>
          {action === 'logout' ? (
            <Button type="button" onClick={() => void onConfirm()}>
              Sign out
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
