'use client';

import { useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/dashboard/data-table';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { PageHeader } from '@/components/layout/page-header';

type ListRow = {
  id: string;
  primary: string;
};

const COLUMNS: DataTableColumn<ListRow>[] = [
  { id: 'primary', header: 'Record', cell: (row) => row.primary },
];

export function AdminListPage({
  kicker,
  title,
  emptyTitle,
  emptyDescription,
}: {
  kicker: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [query, setQuery] = useState('');

  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      <FilterBar value={query} onChange={setQuery} />
      <DataTable
        columns={COLUMNS}
        rows={[]}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </>
  );
}
