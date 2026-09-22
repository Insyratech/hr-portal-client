'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { printInventoryStationLabel } from '@/features/inventory/inventory-station-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryStationMutation,
  useGetInventoryLocationsQuery,
  useGetInventoryStationsQuery,
  useLazyGetInventoryStationPrintQuery,
} from '@/store/api/api';

export function InventoryStationsPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryStationsQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [createStation, { isLoading: creating }] = useCreateInventoryStationMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetInventoryStationPrintQuery();
  const [open, setOpen] = useState(false);

  const locations = useMemo(
    () => (locationsData?.data ?? []).filter((item) => item.status === 'active'),
    [locationsData?.data],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const created = await createStation({
        locationId: String(form.get('locationId') ?? ''),
        name: String(form.get('name') ?? '').trim(),
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      setOpen(false);
      toast.success('Station saved.');
      try {
        const print = await fetchPrint(created.data.id).unwrap();
        printInventoryStationLabel(print.data);
      } catch {
        // Station created even if print blocked.
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to create station.'));
    }
  }

  async function onPrint(id: string) {
    try {
      const print = await fetchPrint(id).unwrap();
      printInventoryStationLabel(print.data);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to open station label.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Stations" />
        <p className="text-sm text-muted">You need plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || printing} />
      <PageHeader
        kicker="Inventory"
        title="Stations"
        actions={
          <Button
            type="button"
            onClick={() => {
              setOpen(true);
            }}
          >
            New station QR
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        One QR per stock location. Lab phones scan it, then pick plastic type, size, and box count.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load stations.</p> : null}

      <DataTable
        columns={[
          { id: 'name', header: 'Station', cell: (row) => row.name },
          {
            id: 'location',
            header: 'Location',
            cell: (row) => `${row.locationName} (${row.locationCode})`,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <Button type="button" variant="outline" size="sm" onClick={() => void onPrint(row.id)}>
                Print QR
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No stations"
        emptyDescription="Create a stock-room station QR, then receive plastic boxes at that location."
      />

      <p className="mt-6 text-sm">
        <Link href="/inventory/plastic" className="underline-offset-2 hover:underline">
          Plastic stock →
        </Link>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>New station QR</DialogTitle>
          <DialogDescription>
            Bind one QR to a location. Plastic stock received at that location appears on the scan
            card.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div>
              <Label htmlFor="locationId">Location</Label>
              <select id="locationId" name="locationId" className={SELECT_CLASS} required defaultValue="">
                <option value="" disabled>
                  Select location
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">Station name</Label>
              <Input id="name" name="name" required placeholder="Stock Room" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create & print'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
