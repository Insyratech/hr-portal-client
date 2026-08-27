'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NamedEntity } from '@/types/api';

export function NamedEntityManager({
  kicker,
  title,
  items,
  isLoading,
  isError,
  onCreate,
  canManage = true,
}: {
  kicker: string;
  title: string;
  items: NamedEntity[];
  isLoading: boolean;
  isError: boolean;
  onCreate: (input: { name: string; code: string }) => Promise<unknown>;
  canManage?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const singular = title.endsWith('s') ? title.slice(0, -1) : title;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      await onCreate({
        name: String(data.get('name') ?? ''),
        code: String(data.get('code') ?? ''),
      });
      form.reset();
      setCreateOpen(false);
    } catch (cause) {
      const message =
        cause && typeof cause === 'object' && 'data' in cause
          ? (cause as { data?: { error?: { message?: string } } }).data?.error?.message
          : null;
      setError(message ?? 'Unable to save.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker={kicker}
        title={title}
        actions={
          canManage ? (
            <Button type="button" onClick={() => { setError(null); setCreateOpen(true); }}>
              Add {singular.toLowerCase()}
            </Button>
          ) : null
        }
      />
      {!canManage ? (
        <p className="mb-6 text-sm text-muted">HR Manager maintains this list. This view is read-only.</p>
      ) : null}
      {error && !createOpen ? <p className="mb-4 text-sm">{error}</p> : null}
      {isError ? <p className="mb-4 text-sm">Unable to load records.</p> : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={items}
        loading={isLoading}
        emptyTitle={`No ${title.toLowerCase()}`}
        emptyDescription={`Use Add ${singular.toLowerCase()} to create the first record.`}
      />

      <Dialog
        open={createOpen && canManage}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add {singular.toLowerCase()}</DialogTitle>
          <DialogDescription>Name and short code for this {singular.toLowerCase()}.</DialogDescription>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
