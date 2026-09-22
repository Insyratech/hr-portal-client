'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetInventoryAlertLogQuery, useGetInventoryAlertsQuery } from '@/store/api/api';

function kindLabel(kind: string): string {
  if (kind === 'expiry') return 'Expiry';
  if (kind === 'reorder') return 'Reorder';
  if (kind === 'velocity') return 'Velocity';
  return kind;
}

export function InventoryAlertsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.INVENTORY_ALERTS_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_OVERVIEW_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryAlertsQuery(undefined, { skip: !canView });
  const { data: logData, isLoading: logLoading } = useGetInventoryAlertLogQuery(14, { skip: !canView });
  const alerts = data?.data ?? [];
  const log = logData?.data ?? [];

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Alerts" />
        <p className="text-sm text-muted">You need alerts view permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Inventory" title="Alerts" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Live low-stock and expiry signals from catalog alert settings (reorder, velocity days, expiry
        lead). A daily job emails Inventory Managers once per lot/SKU per kind — no duplicate spam the
        same day. Tune defaults under Categories / Catalog.
      </p>

      <div className="mb-8 grid max-w-xl grid-cols-2 gap-3">
        <div className="rounded border border-border px-4 py-3">
          <Meta>Active now</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">{alerts.length}</p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Notified (14 days)</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">{log.length}</p>
        </div>
      </div>

      {isError ? <p className="mb-4 text-sm">Unable to load alerts.</p> : null}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium">Active alerts</h2>
        <DataTable
          columns={[
            { id: 'kind', header: 'Kind', cell: (row) => kindLabel(row.alertKind) },
            {
              id: 'title',
              header: 'Alert',
              cell: (row) => (
                <Link href={row.deepLink} className="underline-offset-2 hover:underline">
                  {row.title}
                </Link>
              ),
            },
            { id: 'code', header: 'Code', cell: (row) => row.subjectCode || '—' },
            { id: 'location', header: 'Location', cell: (row) => row.locationName || '—' },
            { id: 'detail', header: 'Detail', cell: (row) => row.detail },
          ]}
          rows={alerts.map((row) => ({
            ...row,
            id: `${row.subjectType}:${row.subjectId}:${row.alertKind}`,
          }))}
          loading={isLoading}
          emptyTitle="No active alerts"
          emptyDescription="Stock levels and expiry dates are within configured thresholds."
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Recent notifications (deduped)</h2>
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (row) => row.alertDate },
            { id: 'kind', header: 'Kind', cell: (row) => kindLabel(row.alertKind) },
            {
              id: 'title',
              header: 'Alert',
              cell: (row) =>
                row.deepLink ? (
                  <Link href={row.deepLink} className="underline-offset-2 hover:underline">
                    {row.title}
                  </Link>
                ) : (
                  row.title
                ),
            },
            { id: 'detail', header: 'Detail', cell: (row) => row.detail },
          ]}
          rows={log}
          loading={logLoading}
          emptyTitle="No alert mail yet"
          emptyDescription="After the daily job runs, claimed alerts appear here once per day per lot."
        />
      </section>
    </>
  );
}
