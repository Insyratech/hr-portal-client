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
  useCategorizeFinanceBankTransactionMutation,
  useCreateFinanceBankTransactionMutation,
  useExcludeFinanceBankTransactionMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceBankAccountsQuery,
  useGetFinanceBankMatchCandidatesQuery,
  useGetFinanceBankTransactionsQuery,
  useMatchFinanceBankTransactionMutation,
  useUnexcludeFinanceBankTransactionMutation,
  useUnmatchFinanceBankTransactionMutation,
} from '@/store/api/api';
import type { BankTransaction } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

type TxnStatus = BankTransaction['status'];

export function FinanceBankingTransactionsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_BANKING_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const [bankAccountId, setBankAccountId] = useState('');
  const [status, setStatus] = useState<TxnStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<BankTransaction | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [categorizeOpen, setCategorizeOpen] = useState(false);

  const filters = useMemo(
    () => ({
      ...(bankAccountId ? { bankAccountId } : {}),
      ...(status ? { status } : {}),
    }),
    [bankAccountId, status],
  );

  const { data, isLoading, isError } = useGetFinanceBankTransactionsQuery(filters, {
    skip: !canView,
  });
  const { data: bankAccountsData } = useGetFinanceBankAccountsQuery(undefined, { skip: !canView });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const { data: candidatesData, isFetching: loadingCandidates } = useGetFinanceBankMatchCandidatesQuery(
    { id: detail?.id ?? '', bankAccountId: detail?.bankAccountId },
    { skip: !matchOpen || !detail },
  );

  const [createTxn, { isLoading: creating }] = useCreateFinanceBankTransactionMutation();
  const [matchTxn, { isLoading: matching }] = useMatchFinanceBankTransactionMutation();
  const [unmatchTxn, { isLoading: unmatching }] = useUnmatchFinanceBankTransactionMutation();
  const [categorizeTxn, { isLoading: categorizing }] = useCategorizeFinanceBankTransactionMutation();
  const [excludeTxn, { isLoading: excluding }] = useExcludeFinanceBankTransactionMutation();
  const [unexcludeTxn, { isLoading: unexcluding }] = useUnexcludeFinanceBankTransactionMutation();

  const bankAccounts = useMemo(
    () => (bankAccountsData?.data ?? []).filter((account) => account.isActive),
    [bankAccountsData],
  );

  const categoryAccounts = useMemo(
    () =>
      (accountsData?.data ?? []).filter(
        (account) =>
          account.isActive && (account.accountType === 'expense' || account.accountType === 'income'),
      ),
    [accountsData],
  );

  const busy = creating || matching || unmatching || categorizing || excluding || unexcluding;

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createTxn({
        bankAccountId: String(form.get('bankAccountId') ?? '').trim(),
        transactionDate: String(form.get('transactionDate') ?? '').trim(),
        description: String(form.get('description') ?? '').trim() || undefined,
        reference: String(form.get('reference') ?? '').trim() || undefined,
        transactionType: String(form.get('transactionType') ?? 'debit') as 'credit' | 'debit',
        amount: Number(form.get('amount')),
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create transaction.'));
    }
  }

  async function onMatch(candidateId: string, matchType: string) {
    if (!detail) return;
    setError(null);
    try {
      const result = await matchTxn({
        id: detail.id,
        body: {
          matchType: matchType as
            | 'customer_payment'
            | 'vendor_payment'
            | 'expense'
            | 'expense_reimbursement'
            | 'transfer',
          matchId: candidateId,
        },
      }).unwrap();
      setDetail(result.data);
      setMatchOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to match transaction.'));
    }
  }

  async function onCategorize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await categorizeTxn({
        id: detail.id,
        body: { categoryAccountId: String(form.get('categoryAccountId') ?? '').trim() },
      }).unwrap();
      setDetail(result.data);
      setCategorizeOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to categorize transaction.'));
    }
  }

  async function onExclude() {
    if (!detail) return;
    setError(null);
    try {
      const result = await excludeTxn(detail.id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to exclude transaction.'));
    }
  }

  async function onUnexclude() {
    if (!detail) return;
    setError(null);
    try {
      const result = await unexcludeTxn(detail.id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to unexclude transaction.'));
    }
  }

  async function onUnmatch() {
    if (!detail) return;
    setError(null);
    try {
      const result = await unmatchTxn(detail.id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to unmatch transaction.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Banking" title="Transactions" />
        <p className="max-w-2xl text-sm text-muted">
          You need banking view permission to open bank transactions.
        </p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader
        kicker="Banking"
        title="Transactions"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setCreateOpen(true);
              }}
            >
              New transaction
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Review imported or manual bank lines, then match, categorize, or exclude them.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[12rem]">
          <Label htmlFor="filterBankAccount">Bank account</Label>
          <select
            id="filterBankAccount"
            className={SELECT_CLASS}
            value={bankAccountId}
            onChange={(event) => setBankAccountId(event.target.value)}
          >
            <option value="">All accounts</option>
            {(bankAccountsData?.data ?? []).map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[10rem]">
          <Label htmlFor="filterStatus">Status</Label>
          <select
            id="filterStatus"
            className={SELECT_CLASS}
            value={status}
            onChange={(event) => setStatus(event.target.value as TxnStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="unmatched">Unmatched</option>
            <option value="matched">Matched</option>
            <option value="categorized">Categorized</option>
            <option value="excluded">Excluded</option>
          </select>
        </div>
      </div>

      {error && !createOpen && !detail && !matchOpen && !categorizeOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load transactions.</p> : null}

      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'date', header: 'Date', cell: (row) => row.transactionDate },
          { id: 'account', header: 'Account', cell: (row) => row.bankAccountName || '—' },
          { id: 'description', header: 'Description', cell: (row) => row.description || '—' },
          { id: 'type', header: 'Type', cell: (row) => row.transactionType },
          { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setDetail(row);
                }}
              >
                Open
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No transactions"
        emptyDescription="Import a statement or create a manual bank transaction."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle>New bank transaction</DialogTitle>
          <DialogDescription>Record a manual credit or debit on a bank account.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="txnBankAccountId">Bank account</Label>
              <select id="txnBankAccountId" name="bankAccountId" className={SELECT_CLASS} required>
                <option value="">Select account</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="transactionDate">Date</Label>
                <Input id="transactionDate" name="transactionDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="transactionType">Type</Label>
                <select
                  id="transactionType"
                  name="transactionType"
                  className={SELECT_CLASS}
                  defaultValue="debit"
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" min={0.01} step="any" required />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Create
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
            setMatchOpen(false);
            setCategorizeOpen(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Transaction'}</DialogTitle>
          <DialogDescription>Match, categorize, exclude, or unmatch this bank line.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Status:</span>{' '}
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Date:</span> {detail.transactionDate}
                </p>
                <p>
                  <span className="text-muted">Account:</span> {detail.bankAccountName || '—'}
                </p>
                <p>
                  <span className="text-muted">Type:</span> {detail.transactionType}
                </p>
                <p>
                  <span className="text-muted">Amount:</span> {formatInr(detail.amount)}
                </p>
                <p>
                  <span className="text-muted">Source:</span> {detail.source}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted">Description:</span> {detail.description || '—'}
                </p>
                {detail.matchLabel ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Matched to:</span> {detail.matchLabel}
                  </p>
                ) : null}
                {detail.categoryAccountName ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Category:</span> {detail.categoryAccountName}
                  </p>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  {detail.status === 'unmatched' ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setMatchOpen(true);
                        }}
                      >
                        Match
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          setCategorizeOpen(true);
                        }}
                      >
                        Categorize
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void onExclude()}>
                        Exclude
                      </Button>
                    </>
                  ) : null}
                  {detail.status === 'matched' ? (
                    <Button type="button" variant="outline" onClick={() => void onUnmatch()}>
                      Unmatch
                    </Button>
                  ) : null}
                  {detail.status === 'excluded' ? (
                    <Button type="button" variant="outline" onClick={() => void onUnexclude()}>
                      Unexclude
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {error && !matchOpen && !categorizeOpen ? (
                <StatusMessage tone="danger">{error}</StatusMessage>
              ) : null}

              {matchOpen ? (
                <div className="space-y-3 rounded border border-border p-4">
                  <p className="text-sm font-medium">Match candidates</p>
                  {loadingCandidates ? (
                    <p className="text-sm text-muted">Loading candidates…</p>
                  ) : (candidatesData?.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted">No matching documents found.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(candidatesData?.data ?? []).map((candidate) => (
                        <li
                          key={`${candidate.type}-${candidate.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                        >
                          <div>
                            <p>{candidate.label}</p>
                            <p className="text-muted">
                              {candidate.documentNumber} · {candidate.date} · {formatInr(candidate.amount)}
                              {candidate.partyName ? ` · ${candidate.partyName}` : ''}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            loading={matching}
                            onClick={() => void onMatch(candidate.id, candidate.type)}
                          >
                            Match
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
                  <Button type="button" variant="outline" size="sm" onClick={() => setMatchOpen(false)}>
                    Close
                  </Button>
                </div>
              ) : null}

              {categorizeOpen ? (
                <form onSubmit={onCategorize} className="space-y-3 rounded border border-border p-4">
                  <p className="text-sm font-medium">Categorize to GL account</p>
                  <div>
                    <Label htmlFor="categoryAccountId">Expense / income account</Label>
                    <select
                      id="categoryAccountId"
                      name="categoryAccountId"
                      className={SELECT_CLASS}
                      required
                    >
                      <option value="">Select account</option>
                      {categoryAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} — {account.name} ({account.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                  {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
                  <div className="flex gap-2">
                    <Button type="submit" loading={categorizing}>
                      Categorize
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setCategorizeOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
