'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
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
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { formatInr, procurementStatusTone } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceJournalMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceJournalsQuery,
  usePostFinanceJournalMutation,
  useReverseFinanceJournalMutation,
} from '@/store/api/api';
import type { JournalEntry } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

type LineDraft = {
  key: string;
  accountId: string;
  description: string;
  debit: string;
  credit: string;
};

function emptyLine(): LineDraft {
  return {
    key: crypto.randomUUID(),
    accountId: '',
    description: '',
    debit: '',
    credit: '',
  };
}

export function FinanceJournalsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE) ||
    canView;

  const { data, isLoading, isError } = useGetFinanceJournalsQuery(undefined, { skip: !canView });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createJournal, { isLoading: creating }] = useCreateFinanceJournalMutation();
  const [postJournal, { isLoading: posting }] = usePostFinanceJournalMutation();
  const [reverseJournal, { isLoading: reversing }] = useReverseFinanceJournalMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<JournalEntry | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(), emptyLine()]);

  const activeAccounts = useMemo(
    () => (accountsData?.data ?? []).filter((account) => account.isActive),
    [accountsData],
  );

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += Number(line.debit) || 0;
      credit += Number(line.credit) || 0;
    }
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 && debit > 0 };
  }, [lines]);

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payloadLines = lines
      .map((line) => ({
        accountId: line.accountId,
        description: line.description.trim() || undefined,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }))
      .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));

    if (payloadLines.length < 2) {
      setError('Add at least two lines with accounts and amounts.');
      return;
    }
    if (!totals.balanced) {
      setError('Debits and credits must balance.');
      return;
    }

    try {
      await createJournal({
        entryDate: String(form.get('entryDate') ?? '').trim(),
        memo: String(form.get('memo') ?? '').trim() || undefined,
        lines: payloadLines,
        post: form.get('post') === 'on',
      }).unwrap();
      setCreateOpen(false);
      setLines([emptyLine(), emptyLine()]);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create journal.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      const result = await postJournal(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post journal.'));
    }
  }

  async function onReverse(id: string) {
    setError(null);
    try {
      const result = await reverseJournal(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to reverse journal.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Journals" />
        <p className="max-w-2xl text-sm text-muted">You need accountant view permission to open journals.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting || reversing} />
      <PageHeader
        kicker="Accountant"
        title="Journals"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setLines([emptyLine(), emptyLine()]);
                setCreateOpen(true);
              }}
            >
              New journal
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Manual journal entries for adjustments. Post drafts to the ledger, or reverse posted entries.
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load journals.</p> : null}
      <DataTable
        columns={[
          { id: 'number', header: 'Number', cell: (row) => row.entryNumber },
          { id: 'date', header: 'Date', cell: (row) => row.entryDate },
          { id: 'memo', header: 'Memo', cell: (row) => row.memo || '—' },
          { id: 'source', header: 'Source', cell: (row) => row.sourceType },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                  Open
                </Button>
                {canManage && row.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => void onPost(row.id)}>
                    Post
                  </Button>
                ) : null}
                {canManage && row.status === 'posted' ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => void onReverse(row.id)}>
                    Reverse
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No journals"
        emptyDescription="Create a manual journal or post documents from Sales, Purchases, or Expenses."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle>New journal</DialogTitle>
          <DialogDescription>Enter balanced debit and credit lines.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="entryDate">Entry date</Label>
                <Input id="entryDate" name="entryDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="memo">Memo</Label>
                <Input id="memo" name="memo" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                  Add line
                </Button>
              </div>
              {lines.map((line, index) => (
                <div key={line.key} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label htmlFor={`account-${line.key}`}>Account</Label>
                    <select
                      id={`account-${line.key}`}
                      className={SELECT_CLASS}
                      value={line.accountId}
                      onChange={(event) => updateLine(line.key, { accountId: event.target.value })}
                      required
                    >
                      <option value="">Select account</option>
                      {activeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor={`desc-${line.key}`}>Description</Label>
                    <Input
                      id={`desc-${line.key}`}
                      value={line.description}
                      onChange={(event) => updateLine(line.key, { description: event.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`debit-${line.key}`}>Debit</Label>
                    <Input
                      id={`debit-${line.key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.debit}
                      onChange={(event) => updateLine(line.key, { debit: event.target.value, credit: '' })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`credit-${line.key}`}>Credit</Label>
                    <Input
                      id={`credit-${line.key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.credit}
                      onChange={(event) => updateLine(line.key, { credit: event.target.value, debit: '' })}
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    {lines.length > 2 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLines((prev) => prev.filter((item) => item.key !== line.key))}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        ×
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <p className={`text-sm ${totals.balanced ? 'text-muted' : 'text-danger'}`}>
                Debits {formatInr(totals.debit)} · Credits {formatInr(totals.credit)}
                {totals.balanced ? ' · Balanced' : ' · Out of balance'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="post" className="rounded border-border" />
              Post immediately
            </label>

            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating} disabled={!totals.balanced}>
                {creating ? 'Saving…' : 'Create journal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.entryNumber ?? 'Journal'}</DialogTitle>
          <DialogDescription>
            {detail?.entryDate} · {detail?.sourceType} · {detail?.status}
          </DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              {detail.memo ? <p className="text-sm text-muted">{detail.memo}</p> : null}
              <DataTable
                columns={[
                  {
                    id: 'account',
                    header: 'Account',
                    cell: (row) => `${row.accountCode ?? ''} ${row.accountName ?? ''}`.trim() || row.accountId,
                  },
                  { id: 'description', header: 'Description', cell: (row) => row.description || '—' },
                  { id: 'debit', header: 'Debit', cell: (row) => (row.debit ? formatInr(row.debit) : '—') },
                  { id: 'credit', header: 'Credit', cell: (row) => (row.credit ? formatInr(row.credit) : '—') },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This journal has no lines."
              />
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex flex-wrap justify-end gap-3">
                {canManage && detail.status === 'draft' ? (
                  <Button type="button" loading={posting} onClick={() => void onPost(detail.id)}>
                    Post
                  </Button>
                ) : null}
                {canManage && detail.status === 'posted' ? (
                  <Button type="button" variant="outline" loading={reversing} onClick={() => void onReverse(detail.id)}>
                    Reverse
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
