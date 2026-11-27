'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetInventoryPlasticStockQuery } from '@/store/api/api';
import type { InventoryPlasticStock } from '@/types/api';

function matchesPlasticSearch(row: InventoryPlasticStock, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.catalogItemName,
    row.sizeLabel,
    row.manufacturer,
    row.locationName,
    row.categoryName,
    row.stockCode,
    row.supplierName,
    row.centralQrName,
    row.status,
    row.notes,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function InventoryPlasticListPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryPlasticStockQuery(undefined, {
    skip: !canManage,
  });
  const [search, setSearch] = useState('');
  const allRows = data?.data ?? [];
  const filteredRows = useMemo(
    () => allRows.filter((row) => matchesPlasticSearch(row, search)),
    [allRows, search],
  );

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Plastic stock" />
        <p className="text-sm text-muted">You need plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Inventory"
        title="Plastic stock"
        actions={
          <Button asChild>
            <Link href="/inventory/receive">Receive</Link>
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Box-level stock (gloves, tips, tubes). Attach to a usage area on receive, then issue by
        scanning that area QR — not per-box labels.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load plastic stock.</p> : null}

      <div className="mb-4 max-w-md space-y-2">
        <Label htmlFor="plastic-search">Search plastic stock</Label>
        <Input
          id="plastic-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Item, size, manufacturer, location…"
          autoComplete="off"
        />
        <p className="text-xs text-muted">
          Showing {filteredRows.length} of {allRows.length}
          {search.trim() ? ' matching' : ''} item{allRows.length === 1 ? '' : 's'}.
        </p>
      </div>

      <DataTable
        columns={[
          {
            id: 'item',
            header: 'Item',
            cell: (row) => (
              <Link
                href={`/inventory/plastic/${row.id}`}
                className="underline-offset-2 hover:underline"
              >
                {row.catalogItemName}
              </Link>
            ),
          },
          { id: 'size', header: 'Size', cell: (row) => row.sizeLabel || '—' },
          { id: 'mfr', header: 'Manufacturer', cell: (row) => row.manufacturer || '—' },
          { id: 'location', header: 'Location', cell: (row) => row.locationName },
          {
            id: 'boxes',
            header: 'Boxes',
            cell: (row) => `${row.boxesOnHand} / ${row.boxesReceived}`,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={filteredRows}
        loading={isLoading}
        emptyTitle={search.trim() ? 'No matching plastic stock' : 'No plastic stock'}
        emptyDescription={
          search.trim()
            ? 'Try a different search term.'
            : 'Receive gloves or tip boxes via Receive — stock attaches to the usage area you choose.'
        }
      />
    </>
  );
}
