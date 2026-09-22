'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditIconButton } from '@/components/ui/edit-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { ALERT_MODES, SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryCategoriesQuery,
  useUpdateInventoryCategoryMutation,
} from '@/store/api/api';
import type { InventoryCategory } from '@/types/api';

function alertLabel(value: string): string {
  return ALERT_MODES.find((item) => item.value === value)?.label ?? value;
}

export function InventoryCategoriesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_CATEGORIES_MANAGE);
  const { data, isLoading, isError } = useGetInventoryCategoriesQuery(undefined, { skip: !canManage });
  const [updateCategory, { isLoading: updating }] = useUpdateInventoryCategoryMutation();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<InventoryCategory | null>(null);

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    const reorderRaw = String(form.get('defaultReorderQty') ?? '').trim();
    try {
      await updateCategory({
        id: editing.id,
        body: {
          defaultAlertMode: String(form.get('defaultAlertMode') ?? 'both') as InventoryCategory['defaultAlertMode'],
          defaultReorderQty: reorderRaw === '' ? null : Number(reorderRaw),
          defaultVelocityDays: Number(form.get('defaultVelocityDays') ?? 15),
          defaultExpiryLeadDays: Number(form.get('defaultExpiryLeadDays') ?? 15),
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update category defaults.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Categories" />
        <p className="text-sm text-muted">You need category manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={updating} />
      <PageHeader kicker="Inventory" title="Categories" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Fixed lab categories. Tune default alert mode, reorder qty, velocity days, and expiry lead days.
        Catalog items inherit these unless overridden.
      </p>
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
      {isError ? <p className="mb-4 text-sm">Unable to load categories.</p> : null}

      <DataTable
        columns={[
          { id: 'name', header: 'Category', cell: (row) => row.name },
          { id: 'mode', header: 'Deduction', cell: (row) => row.deductionMode },
          { id: 'alert', header: 'Alert mode', cell: (row) => alertLabel(row.defaultAlertMode) },
          {
            id: 'reorder',
            header: 'Reorder qty',
            cell: (row) => (row.defaultReorderQty == null ? '—' : String(row.defaultReorderQty)),
          },
          { id: 'velocity', header: 'Velocity days', cell: (row) => String(row.defaultVelocityDays) },
          { id: 'expiry', header: 'Expiry lead', cell: (row) => String(row.defaultExpiryLeadDays) },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <EditIconButton
                label={`Edit ${row.name} defaults`}
                onClick={() => {
                  setError(null);
                  setEditing(row);
                }}
              />
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No categories"
        emptyDescription="Apply migration 072 to seed system categories."
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Alert defaults — {editing?.name}</DialogTitle>
          <DialogDescription>System category code stays fixed ({editing?.code}).</DialogDescription>
          {editing ? (
            <form className="mt-4 space-y-4" onSubmit={onUpdate}>
              <div>
                <Label htmlFor="defaultAlertMode">Alert mode</Label>
                <select
                  id="defaultAlertMode"
                  name="defaultAlertMode"
                  className={SELECT_CLASS}
                  defaultValue={editing.defaultAlertMode}
                >
                  {ALERT_MODES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="defaultReorderQty">Reorder qty</Label>
                  <Input
                    id="defaultReorderQty"
                    name="defaultReorderQty"
                    type="number"
                    min={0}
                    step="any"
                    defaultValue={editing.defaultReorderQty ?? ''}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultVelocityDays">Velocity days</Label>
                  <Input
                    id="defaultVelocityDays"
                    name="defaultVelocityDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={editing.defaultVelocityDays}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="defaultExpiryLeadDays">Expiry lead days</Label>
                  <Input
                    id="defaultExpiryLeadDays"
                    name="defaultExpiryLeadDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={editing.defaultExpiryLeadDays}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
