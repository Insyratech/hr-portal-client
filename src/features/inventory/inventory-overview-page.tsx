'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { useAppSelector } from '@/store/hooks';
import { useGetInventoryOverviewQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

const MODULE_LABELS: Record<string, string> = {
  locations: 'Locations',
  categories: 'Categories',
  catalog: 'Catalog',
  authorizations: 'Authorizations',
  lots: 'QR lots',
  plasticWares: 'Plastic wares',
  reagents: 'Reagents',
  alerts: 'Alerts',
  reports: 'Reports',
  scan: 'Scan',
};

const READY_LINKS: Record<string, string> = {
  locations: '/inventory/locations',
  categories: '/inventory/categories',
  catalog: '/inventory/catalog',
  authorizations: '/inventory/authorizations',
  lots: '/inventory/lots',
  reagents: '/inventory/prep',
  plasticWares: '/inventory/plastic',
  alerts: '/inventory/alerts',
  reports: '/inventory/reports',
  scan: '/inventory/scan',
};

export function InventoryOverviewPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView = permissions.includes(PERMISSIONS.INVENTORY_OVERVIEW_VIEW);
  const { data, isLoading, isError } = useGetInventoryOverviewQuery(undefined, {
    skip: !canView,
  });
  const overview = data?.data;
  const counts = overview?.counts;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Overview" />
        <p className="max-w-2xl text-sm text-muted">
          You need inventory overview permission to open this workspace.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Inventory" title={overview?.title ?? 'Overview'} />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {isLoading
          ? 'Loading inventory workspace…'
          : isError
            ? 'Unable to load inventory overview.'
            : (overview?.message ??
              'Create locations and catalog items, then grant usage and receipt rights.')}
      </p>

      {counts ? (
        <div className="mb-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(
            [
              ['Locations', counts.locations, '/inventory/locations'],
              ['Catalog', counts.catalogItems, '/inventory/catalog'],
              ['Active lots', counts.activeLots ?? 0, '/inventory/lots'],
              ['Plastic', counts.plasticStock ?? 0, '/inventory/plastic'],
              ['Receive', '→', '/inventory/receive'],
              ['Prep', '→', '/inventory/prep'],
              ['Stations', counts.stations ?? 0, '/inventory/stations'],
              ['Scan', '→', '/inventory/scan'],
              ['Alerts', '→', '/inventory/alerts'],
              ['Reports', '→', '/inventory/reports'],
              ['Authorizations', counts.authorizations, '/inventory/authorizations'],
            ] as const
          ).map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="rounded border border-border px-4 py-3 transition-colors hover:bg-surface"
            >
              <p className="text-2xl font-medium tabular-nums">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {overview?.modules ? (
        <section className="max-w-xl">
          <Meta>Module status</Meta>
          <ul className="mt-3 space-y-2">
            {Object.entries(overview.modules).map(([key, status]) => {
              const href = READY_LINKS[key];
              const row = (
                <>
                  <span>{MODULE_LABELS[key] ?? key}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">{status}</span>
                </>
              );
              return (
                <li key={key}>
                  {href && status === 'ready' ? (
                    <Link
                      href={href}
                      className="flex items-center justify-between gap-3 rounded border border-border px-4 py-3 text-sm transition-colors hover:bg-surface"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded border border-border px-4 py-3 text-sm">
                      {row}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
