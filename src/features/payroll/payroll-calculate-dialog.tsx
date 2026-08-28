'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageLoading } from '@/components/ui/page-loading';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  editableFromCompensation,
  PAYROLL_FIXED_EARNINGS,
  PAYROLL_VARIABLE_DEDUCTIONS,
  PAYROLL_VARIABLE_EARNINGS,
  toNumber,
  type PayrollEditableKey,
  type PayrollEditableValues,
} from '@/features/payroll/compensation-fields';
import { formatInr } from '@/features/payroll/format';
import type { PayrollPreviewEmployee } from '@/types/api';
import { useCalculatePayrollMutation, useGetPayrollPreviewQuery } from '@/store/api/api';

type DraftRow = PayrollEditableValues;

function initDraft(employees: PayrollPreviewEmployee[]): Record<string, DraftRow> {
  const next: Record<string, DraftRow> = {};
  for (const employee of employees) {
    if (!employee.compensation) continue;
    next[employee.employeeId] = editableFromCompensation(employee.compensation);
  }
  return next;
}

export function PayrollCalculateDialog({
  importId,
  runHref,
  open,
  onOpenChange,
}: {
  importId: string | null;
  runHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useGetPayrollPreviewQuery(importId ?? '', {
    skip: !open || !importId,
  });
  const [calculate, { isLoading: calculating }] = useCalculatePayrollMutation();
  const [draft, setDraft] = useState<Record<string, DraftRow>>({});

  const preview = data?.data;
  const readyCount = useMemo(() => (preview?.employees ?? []).filter((row) => row.ready).length, [preview]);

  useEffect(() => {
    if (!preview) return;
    setDraft(initDraft(preview.employees));
  }, [preview]);

  function setField(employeeId: string, key: PayrollEditableKey, value: string) {
    setDraft((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        [key]: toNumber(value),
      },
    }));
  }

  async function onCalculate() {
    if (!importId || !preview) return;
    const adjustments = preview.employees
      .filter((row) => row.ready)
      .map((row) => ({
        employeeId: row.employeeId,
        ...draft[row.employeeId],
      }));
    try {
      const result = await calculate({ importId, adjustments }).unwrap();
      toast.success('Payroll calculated. Review slips before publishing.');
      onOpenChange(false);
      router.push(`${runHref}/${result.data.run.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to calculate payroll.'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !calculating && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogTitle>Review compensation before calculating</DialogTitle>
        <DialogDescription>
          {preview
            ? `${preview.monthLabel} · ${preview.calendarDays} calendar days. Update incentives, other earnings, and deductions for this run only. Fixed pay parts come from each employee profile.`
            : 'Load employee compensation for this confirmed month.'}
        </DialogDescription>

        {isLoading ? <PageLoading compact message="Loading compensation…" /> : null}
        {isError ? (
          <div className="mt-4 space-y-3">
            <StatusMessage tone="danger">
              {apiErrorMessage(error, 'Unable to load compensation preview.')}
            </StatusMessage>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {preview && !isLoading ? (
          <div className="mt-6 space-y-4">
            {readyCount === 0 ? (
              <p className="text-sm text-muted">No employees are ready for payroll. Add compensation on employee profiles first.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-border">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-surface text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Employee</th>
                      <th className="px-3 py-2 font-medium">LOP</th>
                      {PAYROLL_FIXED_EARNINGS.map((field) => (
                        <th key={field.key} className="px-3 py-2 font-medium">
                          {field.label}
                        </th>
                      ))}
                      {PAYROLL_VARIABLE_EARNINGS.map((field) => (
                        <th key={field.key} className="px-3 py-2 font-medium">
                          {field.label}
                        </th>
                      ))}
                      {PAYROLL_VARIABLE_DEDUCTIONS.map((field) => (
                        <th key={field.key} className="px-3 py-2 font-medium">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.employees.map((employee) => {
                      const compensation = employee.compensation;
                      const values = draft[employee.employeeId];
                      return (
                        <tr key={employee.employeeId} className="border-t border-border">
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium text-foreground">{employee.fullName}</div>
                            <div className="text-muted">{employee.employeeCode}</div>
                            {!employee.ready ? (
                              <div className="mt-1 text-[11px] text-muted">{employee.skipReason}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 align-top text-muted">{employee.lopDays}</td>
                          {PAYROLL_FIXED_EARNINGS.map((field) => (
                            <td key={field.key} className="px-3 py-2 align-top text-muted">
                              {compensation ? formatInr(compensation[field.key]) : '—'}
                            </td>
                          ))}
                          {[...PAYROLL_VARIABLE_EARNINGS, ...PAYROLL_VARIABLE_DEDUCTIONS].map((field) => (
                            <td key={field.key} className="px-3 py-2 align-top">
                              {employee.ready && values ? (
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="h-8 w-24 px-2 text-xs"
                                  value={values[field.key]}
                                  disabled={calculating}
                                  onChange={(event) => setField(employee.employeeId, field.key, event.target.value)}
                                />
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" disabled={calculating} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={calculating}
                disabled={calculating || readyCount === 0}
                onClick={() => void onCalculate()}
              >
                {calculating ? 'Calculating payroll' : 'Calculate payroll'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
