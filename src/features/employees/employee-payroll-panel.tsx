'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetEmployeePayrollQuery,
  useSaveEmployeeCompensationMutation,
  useSaveEmployeePaymentMutation,
} from '@/store/api/api';

const EARNINGS = [
  { key: 'basic', label: 'Basic', name: 'basic' },
  { key: 'da', label: 'DA', name: 'da' },
  { key: 'hra', label: 'HRA', name: 'hra' },
  { key: 'fuel', label: 'Fuel', name: 'fuel' },
  { key: 'incentives', label: 'Incentives', name: 'incentives' },
  { key: 'other', label: 'Other earnings', name: 'other' },
] as const;

const DEDUCTIONS = [
  { key: 'professionalTax', label: 'Professional tax', name: 'professionalTax' },
  { key: 'tds', label: 'TDS', name: 'tds' },
  { key: 'employeeWelfare', label: 'Employee welfare', name: 'employeeWelfare' },
  { key: 'kpi', label: 'KPI', name: 'kpi' },
  { key: 'otherDeductions', label: 'Other deductions', name: 'otherDeductions' },
] as const;

function money(form: FormData, name: string): number {
  return Number(form.get(name) || 0);
}

function amount(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function EmployeePayrollPanel({
  employeeId,
  joiningDate,
  canManage,
}: {
  employeeId: string;
  joiningDate: string;
  canManage: boolean;
}) {
  const toast = useToast();
  const { data, isLoading, isError } = useGetEmployeePayrollQuery(employeeId);
  const [saveCompensation, { isLoading: savingPay }] = useSaveEmployeeCompensationMutation();
  const [savePayment, { isLoading: savingBank }] = useSaveEmployeePaymentMutation();
  const current = data?.data.current;
  const payment = data?.data.payment;
  const [effectiveFrom, setEffectiveFrom] = useState(joiningDate.slice(0, 10));

  useEffect(() => {
    if (current?.effectiveFrom) {
      setEffectiveFrom(current.effectiveFrom.slice(0, 10));
    }
  }, [current?.effectiveFrom]);

  async function onSavePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveCompensation({
        id: employeeId,
        body: {
          basic: money(form, 'basic'),
          da: money(form, 'da'),
          hra: money(form, 'hra'),
          fuel: money(form, 'fuel'),
          incentives: money(form, 'incentives'),
          other: money(form, 'other'),
          professionalTax: money(form, 'professionalTax'),
          tds: money(form, 'tds'),
          employeeWelfare: money(form, 'employeeWelfare'),
          kpi: money(form, 'kpi'),
          otherDeductions: money(form, 'otherDeductions'),
          effectiveFrom: String(form.get('effectiveFrom') ?? ''),
        },
      }).unwrap();
      toast.success('Compensation saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save compensation.'));
    }
  }

  async function onSaveBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await savePayment({
        id: employeeId,
        body: {
          pan: String(form.get('pan') ?? ''),
          bankAccountNumber: String(form.get('bankAccountNumber') ?? ''),
          bankName: String(form.get('bankName') ?? ''),
          ifsc: String(form.get('ifsc') ?? ''),
        },
      }).unwrap();
      toast.success('Bank details saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save bank details.'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading payroll</p>;
  }
  if (isError) {
    return <p className="text-sm">Unable to load payroll details.</p>;
  }

  return (
    <div className="max-w-3xl space-y-10">
      <form key={`compensation-${current?.id ?? 'new'}`} onSubmit={onSavePay} className="space-y-5">
        <Meta>Compensation</Meta>
        <p className="text-sm text-muted">
          A new effective date keeps history. Same date updates that row. Published salary slips are not changed.
        </p>
        <div>
          <Label htmlFor="effectiveFrom">Effective from</Label>
          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            required
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
            disabled={!canManage}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...EARNINGS, ...DEDUCTIONS].map((item) => (
            <div key={item.name}>
              <Label htmlFor={item.name}>{item.label}</Label>
              {canManage ? (
                <Input
                  id={item.name}
                  name={item.name}
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={current ? current[item.key] : 0}
                />
              ) : (
                <p className="mt-1 text-sm">{current ? amount(current[item.key]) : '—'}</p>
              )}
            </div>
          ))}
        </div>
        {canManage ? (
          <Button type="submit" disabled={savingPay}>
            {savingPay ? 'Saving…' : 'Save compensation'}
          </Button>
        ) : null}
      </form>

      <form key={`payment-${payment?.updatedAt ?? 'new'}`} onSubmit={onSaveBank} className="space-y-5">
        <Meta>Bank / PAN</Meta>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pan">PAN</Label>
            {canManage ? (
              <Input id="pan" name="pan" maxLength={10} defaultValue={payment?.pan ?? ''} autoComplete="off" />
            ) : (
              <p className="mt-1 text-sm">{payment?.pan || '—'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="ifsc">IFSC</Label>
            {canManage ? (
              <Input id="ifsc" name="ifsc" maxLength={11} defaultValue={payment?.ifsc ?? ''} autoComplete="off" />
            ) : (
              <p className="mt-1 text-sm">{payment?.ifsc || '—'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="bankName">Bank name</Label>
            {canManage ? (
              <Input id="bankName" name="bankName" defaultValue={payment?.bankName ?? ''} />
            ) : (
              <p className="mt-1 text-sm">{payment?.bankName || '—'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="bankAccountNumber">Account number</Label>
            {canManage ? (
              <Input
                id="bankAccountNumber"
                name="bankAccountNumber"
                defaultValue={payment?.bankAccountNumber ?? ''}
                autoComplete="off"
              />
            ) : (
              <p className="mt-1 text-sm">{payment?.bankAccountNumber || '—'}</p>
            )}
          </div>
        </div>
        {canManage ? (
          <Button type="submit" disabled={savingBank}>
            {savingBank ? 'Saving…' : 'Save bank details'}
          </Button>
        ) : null}
      </form>

      {(data?.data.history.length ?? 0) > 1 ? (
        <div>
          <Meta>History</Meta>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.data.history.map((row) => (
              <li key={row.id}>
                {row.effectiveFrom.slice(0, 10)} · Basic {amount(row.basic)} · HRA {amount(row.hra)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
