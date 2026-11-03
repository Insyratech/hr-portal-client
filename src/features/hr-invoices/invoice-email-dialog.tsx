'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useSendHrInvoiceMutation } from '@/store/api/api';

export function InvoiceEmailDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: { id: string; invoiceNumber: string; clientName: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const [sendInvoice, { isLoading }] = useSendHrInvoiceMutation();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice) return;
    setError(null);
    const to = String(new FormData(event.currentTarget).get('to') ?? '').trim();
    try {
      const result = await sendInvoice({ id: invoice.id, to }).unwrap();
      toast.success(`Invoice ${invoice.invoiceNumber} sent to ${result.data.to}.`);
      onOpenChange(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to send this invoice.'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogTitle>Email invoice</DialogTitle>
        <DialogDescription>
          {invoice
            ? `Send invoice ${invoice.invoiceNumber} for ${invoice.clientName}. The bill is in the email.`
            : 'Send this invoice.'}
        </DialogDescription>
        <form key={invoice?.id ?? 'none'} className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <div>
            <Label htmlFor="invoice-recipient">Recipient email</Label>
            <Input id="invoice-recipient" name="to" type="email" autoComplete="email" required />
          </div>
          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isLoading ? 'Sending' : 'Send email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
