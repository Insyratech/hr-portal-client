'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { Meta } from '@/components/layout/meta';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import type { InventoryReportsBundle } from '@/types/api';

type Props = {
  reports: InventoryReportsBundle;
  loading?: boolean;
};

export function InventoryReportsPanels({ reports, loading = false }: Props) {
  const { spend, usage, adjustments } = reports;

  return (
    <>
      <div className="mb-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Spend', formatInr(spend.total)],
            ['Lot spend', formatInr(spend.lotSpend)],
            ['Plastic spend', formatInr(spend.plasticSpend)],
            ['Issues', usage.issueCount],
            ['Adjustments', adjustments.count],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded border border-border px-4 py-3">
            <p className="text-2xl font-medium tabular-nums">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <p className="mb-8 max-w-3xl text-sm text-muted">{spend.note}</p>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Spend by category</h2>
        <Meta>Purchase lots + plastic receipts in range</Meta>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Category', cell: (row) => row.name },
              { id: 'amount', header: 'Spend', cell: (row) => formatInr(row.amount) },
            ]}
            rows={spend.byCategory}
            loading={loading}
            emptyTitle="No spend by category"
            emptyDescription="No purchased lots or plastic receipts in this range."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Spend by location</h2>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Location', cell: (row) => row.name },
              { id: 'amount', header: 'Spend', cell: (row) => formatInr(row.amount) },
            ]}
            rows={spend.byLocation}
            loading={loading}
            emptyTitle="No spend by location"
            emptyDescription="No purchased lots or plastic receipts in this range."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Spend by catalog item</h2>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Item', cell: (row) => row.name },
              { id: 'amount', header: 'Spend', cell: (row) => formatInr(row.amount) },
            ]}
            rows={spend.byCatalogItem}
            loading={loading}
            emptyTitle="No spend by item"
            emptyDescription="No purchased lots or plastic receipts in this range."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Usage leaderboard — people</h2>
        <Meta>Issue movements (lots + plastic boxes)</Meta>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Employee', cell: (row) => row.name },
              { id: 'issues', header: 'Issues', cell: (row) => row.issueCount },
              {
                id: 'qty',
                header: 'Qty',
                cell: (row) => `${row.qty} ${row.unit || ''}`.trim(),
              },
            ]}
            rows={usage.byEmployee}
            loading={loading}
            emptyTitle="No usage"
            emptyDescription="No issue movements in this range."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Usage by catalog item</h2>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Item', cell: (row) => row.name },
              { id: 'issues', header: 'Issues', cell: (row) => row.issueCount },
              {
                id: 'qty',
                header: 'Qty',
                cell: (row) => `${row.qty} ${row.unit || ''}`.trim(),
              },
            ]}
            rows={usage.byCatalogItem}
            loading={loading}
            emptyTitle="No item usage"
            emptyDescription="No issue movements in this range."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium">Usage by category</h2>
        <div className="mt-3">
          <DataTable
            columns={[
              { id: 'name', header: 'Category', cell: (row) => row.name },
              { id: 'issues', header: 'Issues', cell: (row) => row.issueCount },
              {
                id: 'qty',
                header: 'Qty',
                cell: (row) => `${row.qty} ${row.unit || ''}`.trim(),
              },
            ]}
            rows={usage.byCategory}
            loading={loading}
            emptyTitle="No category usage"
            emptyDescription="No issue movements in this range."
          />
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-1 text-sm font-medium">Leakage / adjustments</h2>
        <Meta>Manual stock corrections on lots and plastic</Meta>
        <div className="mt-3">
          <DataTable
            columns={[
              {
                id: 'when',
                header: 'When',
                cell: (row) => row.createdAt.slice(0, 16).replace('T', ' '),
              },
              {
                id: 'code',
                header: 'Code',
                cell: (row) => {
                  const href =
                    row.subjectType === 'lot'
                      ? `/inventory/lots/${row.subjectId}`
                      : `/inventory/plastic/${row.subjectId}`;
                  return row.subjectCode ? (
                    <Link href={href} className="underline-offset-2 hover:underline">
                      {row.subjectCode}
                    </Link>
                  ) : (
                    '—'
                  );
                },
              },
              { id: 'item', header: 'Item', cell: (row) => row.itemName || '—' },
              {
                id: 'qty',
                header: 'Delta',
                cell: (row) => `${row.qty} ${row.unit || ''}`.trim(),
              },
              { id: 'who', header: 'By', cell: (row) => row.employeeName || '—' },
              { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
            ]}
            rows={adjustments.rows}
            loading={loading}
            emptyTitle="No adjustments"
            emptyDescription="No leakage or correction movements in this range."
          />
        </div>
      </section>
    </>
  );
}
