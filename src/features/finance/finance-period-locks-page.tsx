'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFinancePeriodLocksQuery,
  useLockFinancePeriodMutation,
  useUnlockFinancePeriodMutation,
} from '@/store/api/api';
import type { PeriodLock } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function monthLabel(month: number): string {
  return MONTHS[month - 1] ?? String(month);
}

export function FinancePeriodLocksPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);

  const { data, isLoading, isError } = useGetFinancePeriodLocksQuery(undefined, { skip: !canView });
  const [lockPeriod, { isLoading: locking }] = useLockFinancePeriodMutation();
  const [unlockPeriod, { isLoading: unlocking }] = useUnlockFinancePeriodMutation();

  const [error, setError] = useState<string | null>(null);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  async function onLock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await lockPeriod({
        periodYear: Number(form.get('periodYear')),
        periodMonth: Number(form.get('periodMonth')),
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to lock period.'));
    }
  }

  async function onUnlock(lock: PeriodLock) {
    if (!canManage) return;
    setError(null);
    const key = `${lock.periodYear}-${lock.periodMonth}`;
    setUnlockingKey(key);
    try {
      await unlockPeriod({ periodYear: lock.periodYear, periodMonth: lock.periodMonth }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to unlock period.'));
    } finally {
      setUnlockingKey(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Period lock" />
        <p className="max-w-2xl text-sm text-muted">You need accountant view permission to open period locks.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={locking || unlocking} />
      <PageHeader kicker="Accountant" title="Period lock" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Lock a calendar month to reject further posting into that period. Unlock if a correction is needed.
      </p>
      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load period locks.</p> : null}

      {canManage ? (
        <form onSubmit={onLock} className="mb-8 grid max-w-2xl gap-4 rounded border border-border p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="periodYear">Year</Label>
            <Input id="periodYear" name="periodYear" type="number" min={2000} max={2100} defaultValue={defaultYear} required />
          </div>
          <div>
            <Label htmlFor="periodMonth">Month</Label>
            <select id="periodMonth" name="periodMonth" className={SELECT_CLASS} defaultValue={defaultMonth} required>
              {MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" loading={locking}>
              {locking ? 'Locking…' : 'Lock period'}
            </Button>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={[
          {
            id: 'period',
            header: 'Period',
            cell: (row) => `${monthLabel(row.periodMonth)} ${row.periodYear}`,
          },
          { id: 'lockedAt', header: 'Locked at', cell: (row) => row.lockedAt },
          { id: 'lockedBy', header: 'Locked by', cell: (row) => row.lockedByName || '—' },
          { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
          ...(canManage
            ? [
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row: PeriodLock) => (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={unlockingKey === `${row.periodYear}-${row.periodMonth}`}
                      onClick={() => void onUnlock(row)}
                    >
                      Unlock
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No locked periods"
        emptyDescription="Lock a month when books for that period are final."
      />
    </>
  );
}
