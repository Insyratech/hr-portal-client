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
import {
  formatInr,
  newIndentLine,
  procurementStatusTone,
  type IndentLineDraft,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceIndentMutation,
  useDecideFinanceIndentMutation,
  useGetFinanceIndentsQuery,
  useSubmitFinanceIndentMutation,
} from '@/store/api/api';
import type { PurchaseIndent } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

function linesFromDraft(lines: IndentLineDraft[]) {
  return lines
    .map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unit: line.unit.trim() || 'nos',
      estimatedRate: Number(line.estimatedRate),
    }))
    .filter((line) => line.description && line.quantity > 0);
}

type Props = {
  mode?: 'finance' | 'employee';
};

export function FinanceIndentsPage({ mode = 'finance' }: Props) {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canApply = permissions.includes(PERMISSIONS.FINANCE_INDENT_APPLY);
  const canApprove = permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canView =
    canApply ||
    canApprove ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinanceIndentsQuery(undefined, { skip: !canView });
  const [createIndent, { isLoading: creating }] = useCreateFinanceIndentMutation();
  const [submitIndent, { isLoading: submitting }] = useSubmitFinanceIndentMutation();
  const [decideIndent, { isLoading: deciding }] = useDecideFinanceIndentMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<PurchaseIndent | null>(null);
  const [lines, setLines] = useState<IndentLineDraft[]>([newIndentLine()]);
  const [decideComment, setDecideComment] = useState('');

  const rows = useMemo(() => data?.data ?? [], [data]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const prepared = linesFromDraft(lines);
    if (!prepared.length) {
      setError('Add at least one line with description and quantity.');
      return;
    }
    try {
      await createIndent({
        purpose: String(form.get('purpose') ?? '').trim(),
        justification: String(form.get('justification') ?? '').trim(),
        priority: String(form.get('priority') ?? 'normal') as PurchaseIndent['priority'],
        requiredDate: String(form.get('requiredDate') ?? '').trim() || null,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setLines([newIndentLine()]);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create indent.'));
    }
  }

  async function onSubmit(id: string) {
    setError(null);
    try {
      const result = await submitIndent(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to submit indent.'));
    }
  }

  async function onDecide(decision: 'approve' | 'reject') {
    if (!detail) return;
    setError(null);
    try {
      const result = await decideIndent({
        id: detail.id,
        body: { decision, comment: decideComment.trim() || undefined },
      }).unwrap();
      setDetail(result.data);
      setDecideComment('');
    } catch (cause) {
      setError(apiErrorMessage(cause, `Unable to ${decision} indent.`));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker={mode === 'employee' ? 'Requests' : 'Purchases'} title="Indents" />
        <p className="max-w-2xl text-sm text-muted">You need indent permission to view purchase indents.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || submitting || deciding} />
      <PageHeader
        kicker={mode === 'employee' ? 'Requests' : 'Purchases'}
        title={mode === 'employee' ? 'My indents' : 'Indents'}
        actions={
          canApply ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setLines([newIndentLine()]);
                setCreateOpen(true);
              }}
            >
              New indent
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {mode === 'employee'
          ? 'Raise a purchase indent, submit it for Finance review, and track status.'
          : 'Employee purchase requests — submit drafts and approve or reject submitted indents.'}
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load indents.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'requester', header: 'Requester', cell: (row) => row.requesterName || '—' },
          { id: 'purpose', header: 'Purpose', cell: (row) => row.purpose },
          { id: 'priority', header: 'Priority', cell: (row) => row.priority },
          {
            id: 'total',
            header: 'Estimate',
            cell: (row) => formatInr(row.estimatedTotal),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                  Open
                </Button>
                {canApply && row.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => void onSubmit(row.id)}>
                    Submit
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={isLoading}
        emptyTitle="No indents"
        emptyDescription="Create an indent to start a purchase request."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New purchase indent</DialogTitle>
          <DialogDescription>Describe what you need and add estimated line items.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" name="purpose" required />
            </div>
            <div>
              <Label htmlFor="justification">Justification</Label>
              <Input id="justification" name="justification" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select id="priority" name="priority" className={SELECT_CLASS} defaultValue="normal">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="requiredDate">Required by</Label>
                <Input id="requiredDate" name="requiredDate" type="date" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newIndentLine()])}>
                  Add line
                </Button>
              </div>
              {lines.map((line, index) => (
                <div key={line.key} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <Label>Description</Label>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, quantity: event.target.value } : item)),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Unit</Label>
                    <Input
                      value={line.unit}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, unit: event.target.value } : item)),
                        )
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Est. rate</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.estimatedRate}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, estimatedRate: event.target.value } : item,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                {creating ? 'Saving…' : 'Create draft'}
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
            setDecideComment('');
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Indent'}</DialogTitle>
          <DialogDescription>Review indent details and take action.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Status:</span>{' '}
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Priority:</span> {detail.priority}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted">Purpose:</span> {detail.purpose}
                </p>
                {detail.justification ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Justification:</span> {detail.justification}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted">Estimate:</span> {formatInr(detail.estimatedTotal)}
                </p>
                {detail.reviewerComment ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Reviewer comment:</span> {detail.reviewerComment}
                  </p>
                ) : null}
              </div>
              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  { id: 'quantity', header: 'Qty', cell: (row) => `${row.quantity} ${row.unit || ''}`.trim() },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.estimatedRate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This indent has no line items."
              />
              {canApply && detail.status === 'draft' ? (
                <Button type="button" onClick={() => void onSubmit(detail.id)}>
                  Submit for approval
                </Button>
              ) : null}
              {canApprove && detail.status === 'submitted' ? (
                <div className="space-y-3 rounded border border-border p-3">
                  <div>
                    <Label htmlFor="decideComment">Comment</Label>
                    <Input
                      id="decideComment"
                      value={decideComment}
                      onChange={(event) => setDecideComment(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void onDecide('approve')}>
                      Approve
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void onDecide('reject')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MyIndentsPage() {
  return <FinanceIndentsPage mode="employee" />;
}
