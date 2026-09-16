'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Icon } from '@/components/ui/icon';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceReportCatalogQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceReportsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);

  const { data, isLoading, isError } = useGetFinanceReportCatalogQuery(undefined, { skip: !canView });
  const items = data?.data ?? [];

  const packs = items.reduce<Array<{ pack: string; packLabel: string; reports: typeof items }>>(
    (acc, item) => {
      const existing = acc.find((p) => p.pack === item.pack);
      if (existing) existing.reports.push(item);
      else acc.push({ pack: item.pack, packLabel: item.packLabel, reports: [item] });
      return acc;
    },
    [],
  );

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Reports" title="Reports center" />
        <p className="max-w-2xl text-sm text-muted">You need reports view permission to open this page.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Reports" title="Reports center" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Business overview, sales, receivables, payables, purchases, tax, banking, and activity. Each report
        drills to source documents.
      </p>

      {isError ? <p className="mb-4 text-sm">Unable to load report catalog.</p> : null}
      {isLoading ? <p className="text-sm text-muted">Loading catalog…</p> : null}

      <div className="space-y-10">
        {packs.map((pack) => (
          <section key={pack.pack}>
            <Meta className="mb-3">{pack.packLabel}</Meta>
            <ul className="max-w-2xl space-y-2">
              {pack.reports.map((report) => (
                <li key={report.id}>
                  <Link
                    href={report.href}
                    className="flex items-start gap-3 rounded border border-border px-4 py-3 transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{report.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{report.description}</p>
                    </div>
                    <Icon name="chevron-right" className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
