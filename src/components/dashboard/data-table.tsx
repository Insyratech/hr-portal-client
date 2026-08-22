import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-background shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="px-4 py-3.5 font-medium">
                  <Meta>{column.header}</Meta>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <Meta className="mb-2">{emptyTitle}</Meta>
                  <p className="mx-auto max-w-md text-sm text-muted">{emptyDescription}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-surface/80"
                >
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3.5 text-foreground">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 ? (
        <div className="border-t border-border bg-surface/60 px-4 py-3">
          <Meta>
            {rows.length} row{rows.length === 1 ? '' : 's'}
          </Meta>
        </div>
      ) : null}
    </div>
  );
}
