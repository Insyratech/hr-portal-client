'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type ActionConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  /** Destructive actions use the default primary button; label should say Delete / Remove. */
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-app confirm for uploads and deletes (replaces browser `window.confirm`). */
export function ActionConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pending = false,
  onConfirm,
  onCancel,
}: ActionConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
    >
      <DialogContent showClose={!pending}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="button" loading={pending} disabled={pending} onClick={onConfirm}>
            {pending ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
