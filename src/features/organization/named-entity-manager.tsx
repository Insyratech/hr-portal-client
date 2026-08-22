'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
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
}: {
  kicker: string;
  title: string;
  items: NamedEntity[];
  isLoading: boolean;
  isError: boolean;
  onCreate: (input: { name: string; code: string }) => Promise<unknown>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      <PageHeader kicker={kicker} title={title} />
      <form onSubmit={onSubmit} className="mb-8 grid max-w-xl gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            Add
          </Button>
        </div>
      </form>
      {error ? <p className="mb-4 text-sm">{error}</p> : null}
      {isError ? <p className="mb-4 text-sm">Unable to load records.</p> : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={items}
        emptyTitle={isLoading ? 'Loading' : `No ${title.toLowerCase()}`}
        emptyDescription="Create the first record above."
      />
    </>
  );
}
