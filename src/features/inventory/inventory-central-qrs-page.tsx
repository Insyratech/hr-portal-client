'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  downloadInventoryCentralQrLabel,
  printInventoryCentralQrLabel,
} from '@/features/inventory/inventory-central-qr-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryCentralQrsQuery,
  useLazyGetInventoryCentralQrPrintQuery,
} from '@/store/api/api';
import type { InventoryCentralQr } from '@/types/api';

const KIND_HINT: Record<string, string> = {
  stock_room: 'Take out measured lots and plasticwares',
  stationery: 'Take out stationery / miscellaneous boxes',
  inside_lab: 'Lab work logging via recipes and work types',
};

export function InventoryCentralQrsPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryCentralQrsQuery(undefined, { skip: !canManage });
  const [fetchPrint, { isFetching: printing }] = useLazyGetInventoryCentralQrPrintQuery();

  async function onDownload(id: string) {
    try {
      const print = await fetchPrint(id).unwrap();
      await downloadInventoryCentralQrLabel(print.data);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to download the usage area QR.'));
    }
  }

  async function onPrint(id: string) {
    try {
      const print = await fetchPrint(id).unwrap();
      await printInventoryCentralQrLabel(print.data);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to open usage area QR label.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Usage areas" />
        <p className="text-sm text-muted">You need lots or plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={printing} />
      <PageHeader kicker="Inventory" title="Usage areas" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Three fixed scan QRs — Stock room, Stationery, and Inside lab. Print and post these for
        usage. On receive, attach stock to one of these areas. Shelf placement is separate under
        Locations.
      </p>
      {isError ? (
        <p className="mb-4 text-sm">Unable to load usage areas. Apply migration 095 if missing.</p>
      ) : null}

      <DataTable<InventoryCentralQr>
        columns={[
          { id: 'name', header: 'Area', cell: (row) => row.name },
          {
            id: 'kind',
            header: 'Use',
            cell: (row) => KIND_HINT[row.kind] ?? row.kind,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void onDownload(row.id)}>
                  Download
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void onPrint(row.id)}>
                  Print QR
                </Button>
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No usage areas"
        emptyDescription="Apply migration 095 to seed Stock room, Stationery, and Inside lab."
      />
    </>
  );
}
