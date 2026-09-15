'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetFinanceTaxGroupsQuery,
  useGetFinanceTaxRatesQuery,
  useGetFinanceTdsRatesQuery,
} from '@/store/api/api';

export function FinanceTaxPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canViewTax = permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE)
    || permissions.includes(PERMISSIONS.FINANCE_ITEMS_MANAGE);
  const canViewTds = permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);

  const {
    data: groupsData,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useGetFinanceTaxGroupsQuery(undefined, { skip: !canViewTax });
  const {
    data: ratesData,
    isLoading: ratesLoading,
    isError: ratesError,
  } = useGetFinanceTaxRatesQuery(undefined, { skip: !canViewTax });
  const {
    data: tdsData,
    isLoading: tdsLoading,
    isError: tdsError,
  } = useGetFinanceTdsRatesQuery(undefined, { skip: !canViewTds });

  if (!canViewTax) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Tax" />
        <p className="max-w-2xl text-sm text-muted">You need tax manage permission to view tax masters.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Accountant" title="Tax" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Seeded GST groups, rates, and TDS sections. Editing masters lands in a later phase; review here for Getting
        started.
      </p>

      <section className="mb-10">
        <Meta className="mb-3">Tax groups</Meta>
        {groupsError ? <p className="mb-4 text-sm">Unable to load tax groups.</p> : null}
        <DataTable
          columns={[
            { id: 'name', header: 'Name', cell: (row) => row.name },
            {
              id: 'rates',
              header: 'Rates',
              cell: (row) =>
                row.rates.length
                  ? row.rates.map((rate) => `${rate.name} (${rate.ratePercent}%)`).join(', ')
                  : '—',
            },
            { id: 'active', header: 'Active', cell: (row) => (row.isActive ? 'Yes' : 'No') },
          ]}
          rows={groupsData?.data ?? []}
          loading={groupsLoading}
          emptyTitle="No tax groups"
          emptyDescription="Apply the finance foundation migration to seed GST groups."
        />
      </section>

      <section className="mb-10">
        <Meta className="mb-3">Tax rates</Meta>
        {ratesError ? <p className="mb-4 text-sm">Unable to load tax rates.</p> : null}
        <DataTable
          columns={[
            { id: 'name', header: 'Name', cell: (row) => row.name },
            { id: 'taxType', header: 'Type', cell: (row) => row.taxType },
            { id: 'rate', header: 'Rate %', cell: (row) => row.ratePercent },
            { id: 'active', header: 'Active', cell: (row) => (row.isActive ? 'Yes' : 'No') },
          ]}
          rows={ratesData?.data ?? []}
          loading={ratesLoading}
          emptyTitle="No tax rates"
          emptyDescription="GST component rates appear after migration seed."
        />
      </section>

      {canViewTds ? (
        <section>
          <Meta className="mb-3">TDS rates</Meta>
          {tdsError ? <p className="mb-4 text-sm">Unable to load TDS rates.</p> : null}
          <DataTable
            columns={[
              { id: 'section', header: 'Section', cell: (row) => row.section },
              { id: 'name', header: 'Name', cell: (row) => row.name },
              { id: 'rate', header: 'Rate %', cell: (row) => row.ratePercent },
              { id: 'active', header: 'Active', cell: (row) => (row.isActive ? 'Yes' : 'No') },
            ]}
            rows={tdsData?.data ?? []}
            loading={tdsLoading}
            emptyTitle="No TDS rates"
            emptyDescription="TDS sections appear after migration seed."
          />
        </section>
      ) : null}
    </>
  );
}
