'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-loading';
import { StatusMessage } from '@/components/ui/status-message';
import { toNumber } from '@/features/payroll/compensation-fields';
import { formatInr } from '@/features/payroll/format';
import { PayslipPlaygroundDocument } from '@/features/payroll/playground-document';
import { downloadPayslipPlaygroundPdf, printPayslipPlayground } from '@/features/payroll/playground-print';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetPayslipPlaygroundSeedQuery,
  usePreviewPayslipPlaygroundMutation,
} from '@/store/api/api';
import type {
  PayslipPlaygroundPreview,
  PayslipPlaygroundPreviewInput,
  PayslipPlaygroundSeed,
} from '@/types/api';

type FormState = {
  period: string;
  calendarDays: string;
  workingDays: string;
  lopDays: string;
  basic: string;
  da: string;
  hra: string;
  fuel: string;
  incentives: string;
  other: string;
  professionalTax: string;
  employeeWelfare: string;
  otherDeductions: string;
  tdsOverride: string;
  useTdsOverride: boolean;
  otherIncomeAnnual: string;
  relief89: string;
};

function daysInPeriod(period: string): number {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return 30;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formFromSeed(seed: PayslipPlaygroundSeed): FormState {
  const days = daysInPeriod(seed.suggestedPeriod);
  return {
    period: seed.suggestedPeriod,
    calendarDays: String(days),
    workingDays: String(days),
    lopDays: '0',
    basic: String(seed.compensation.basic),
    da: String(seed.compensation.da),
    hra: String(seed.compensation.hra),
    fuel: String(seed.compensation.fuel),
    incentives: String(seed.compensation.incentives),
    other: String(seed.compensation.other),
    professionalTax: String(seed.compensation.professionalTax),
    employeeWelfare: String(seed.compensation.employeeWelfare),
    otherDeductions: String(seed.compensation.otherDeductions),
    tdsOverride: '',
    useTdsOverride: false,
    otherIncomeAnnual: '0',
    relief89: '0',
  };
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'number',
  step,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: 'number' | 'month';
  step?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={type === 'number' ? (step ?? '0.01') : undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SeedShell({ seed }: { seed: PayslipPlaygroundSeed }) {
  return (
    <section className="mb-8 space-y-4 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Extracted from your record</h2>
        <p className="mt-1 text-sm text-muted">
          Sandbox only — nothing here is published. Refresh clears edits.
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted">Employee</dt>
          <dd className="font-medium text-foreground">
            {seed.employee.fullName} · {seed.employee.employeeCode}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Company</dt>
          <dd className="font-medium text-foreground">{seed.company.name || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">Designation</dt>
          <dd className="font-medium text-foreground">{seed.employee.designationName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">Department</dt>
          <dd className="font-medium text-foreground">{seed.employee.departmentName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">Joining</dt>
          <dd className="font-medium text-foreground">{seed.employee.joiningDate ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">PAN / Bank</dt>
          <dd className="font-medium text-foreground">
            {seed.payment.pan ?? '—'} · {seed.payment.bankName ?? '—'}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Leave balances</h3>
        {seed.leave.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No leave allocations for the current calendar year.</p>
        ) : (
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {seed.leave.map((row) => (
              <li key={`${row.code}-${row.name}`} className="text-foreground">
                {row.code ? `${row.code} · ${row.name}` : row.name}: opening {row.opening}, accrued{' '}
                {row.accrued}, availed {row.availed}, closing {row.closing}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Published slips (for YTD)
        </h3>
        {seed.publishedSlips.length === 0 ? (
          <p className="mt-1 text-sm text-muted">
            No published slips yet — YTD columns will start at zero until HR publishes months.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {seed.publishedSlips.map((slip) => (
              <li key={slip.id} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5">
                <span className="text-foreground">{slip.monthLabel}</span>
                <span className="tabular-nums text-muted">
                  Gross {formatInr(slip.gross)} · Net {formatInr(slip.net)} · TDS {formatInr(slip.tds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function PayslipPlaygroundPage() {
  const toast = useToast();
  const { data, isLoading, isError, error, isSuccess } = useGetPayslipPlaygroundSeedQuery();
  const [previewMut, { isLoading: previewing }] = usePreviewPayslipPlaygroundMutation();
  const seed = data?.data;
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState<PayslipPlaygroundPreview | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!seed) return;
    setForm(formFromSeed(seed));
    setPreview(null);
  }, [seed]);

  const body = useMemo((): PayslipPlaygroundPreviewInput | null => {
    if (!form) return null;
    return {
      period: form.period,
      calendarDays: toNumber(form.calendarDays),
      workingDays: toNumber(form.workingDays),
      lopDays: toNumber(form.lopDays),
      basic: toNumber(form.basic),
      da: toNumber(form.da),
      hra: toNumber(form.hra),
      fuel: toNumber(form.fuel),
      incentives: toNumber(form.incentives),
      other: toNumber(form.other),
      professionalTax: toNumber(form.professionalTax),
      employeeWelfare: toNumber(form.employeeWelfare),
      otherDeductions: toNumber(form.otherDeductions),
      tdsOverride: form.useTdsOverride ? toNumber(form.tdsOverride) : null,
      otherIncomeAnnual: toNumber(form.otherIncomeAnnual),
      relief89: toNumber(form.relief89),
    };
  }, [form]);

  function patch(key: keyof FormState, value: string | boolean) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setPreview(null);
  }

  function onPeriodChange(next: string) {
    const days = daysInPeriod(next);
    setForm((prev) =>
      prev
        ? {
            ...prev,
            period: next,
            calendarDays: String(days),
            workingDays: String(days),
          }
        : prev,
    );
    setPreview(null);
  }

  async function onPreview() {
    if (!body) return;
    if (!body.period || !/^\d{4}-\d{2}$/.test(body.period)) {
      toast.error('Choose a month as YYYY-MM.');
      return;
    }
    if (body.workingDays < 0 || body.workingDays > (body.calendarDays ?? 31)) {
      toast.error('Working days must be between 0 and calendar days.');
      return;
    }
    try {
      const result = await previewMut(body).unwrap();
      setPreview(result.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Unable to build playground slip.'));
    }
  }

  function onPrint() {
    if (!preview) return;
    const opened = printPayslipPlayground(preview);
    if (!opened) toast.error('Allow pop-ups to print the playground slip.');
  }

  async function onDownloadPdf() {
    if (!preview || downloading) return;
    setDownloading(true);
    try {
      await downloadPayslipPlaygroundPdf(preview);
      toast.success('Playground slip PDF downloaded.');
    } catch {
      toast.error('Unable to download the playground slip PDF.');
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader kicker="Payslips" title="Payslip playground" />
        <PageLoading compact message="Loading playground…" />
      </>
    );
  }

  if (isError || !isSuccess || !seed) {
    return (
      <>
        <PageHeader kicker="Payslips" title="Payslip playground" />
        <div className="mb-6">
          <Link href="/payslips" className="text-sm text-muted hover:text-foreground">
            Back to payslips
          </Link>
        </div>
        <StatusMessage tone="danger">
          {apiErrorMessage(error, 'This playground is only available for your account.')}
        </StatusMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Payslips" title="Payslip playground" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/payslips" className="text-sm text-muted hover:text-foreground">
          Back to payslips
        </Link>
        {preview ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={downloading}
              onClick={() => void onDownloadPdf()}
            >
              {downloading ? 'Downloading' : 'Download PDF'}
            </Button>
          </div>
        ) : null}
      </div>

      <SeedShell seed={seed} />

      {form ? (
        <section className="mb-8 space-y-4 rounded border border-border bg-surface p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Inputs</h2>
            <p className="mt-1 text-sm text-muted">
              Prefill from compensation master. Edit any field, then build a preview. TDS is computed
              from the new regime unless you override it.
            </p>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Month & attendance</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="period" label="Month" type="month" value={form.period} onChange={onPeriodChange} />
            <Field
              id="calendarDays"
              label="Calendar days"
              value={form.calendarDays}
              onChange={(v) => patch('calendarDays', v)}
              step="1"
            />
            <Field
              id="workingDays"
              label="Working days"
              value={form.workingDays}
              onChange={(v) => patch('workingDays', v)}
              step="1"
            />
            <Field
              id="lopDays"
              label="LOP days"
              value={form.lopDays}
              onChange={(v) => patch('lopDays', v)}
              step="0.5"
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Earnings</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="basic" label="Basic" value={form.basic} onChange={(v) => patch('basic', v)} />
            <Field id="da" label="DA" value={form.da} onChange={(v) => patch('da', v)} />
            <Field id="hra" label="HRA" value={form.hra} onChange={(v) => patch('hra', v)} />
            <Field id="fuel" label="Fuel" value={form.fuel} onChange={(v) => patch('fuel', v)} />
            <Field
              id="incentives"
              label="Incentives"
              value={form.incentives}
              onChange={(v) => patch('incentives', v)}
            />
            <Field id="other" label="Other" value={form.other} onChange={(v) => patch('other', v)} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Deductions</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="professionalTax"
              label="Professional tax"
              value={form.professionalTax}
              onChange={(v) => patch('professionalTax', v)}
            />
            <Field
              id="employeeWelfare"
              label="Employee welfare"
              value={form.employeeWelfare}
              onChange={(v) => patch('employeeWelfare', v)}
            />
            <Field
              id="otherDeductions"
              label="Other deductions"
              value={form.otherDeductions}
              onChange={(v) => patch('otherDeductions', v)}
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tax inputs</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="otherIncomeAnnual"
              label="Other income (annual)"
              value={form.otherIncomeAnnual}
              onChange={(v) => patch('otherIncomeAnnual', v)}
            />
            <Field
              id="relief89"
              label="Relief u/s 89"
              value={form.relief89}
              onChange={(v) => patch('relief89', v)}
            />
            <div className="space-y-1">
              <Label htmlFor="tdsOverride">TDS override (optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  id="useTdsOverride"
                  type="checkbox"
                  checked={form.useTdsOverride}
                  onChange={(e) => patch('useTdsOverride', e.target.checked)}
                  className="h-4 w-4"
                />
                <Input
                  id="tdsOverride"
                  type="number"
                  step="0.01"
                  disabled={!form.useTdsOverride}
                  value={form.tdsOverride}
                  onChange={(e) => patch('tdsOverride', e.target.value)}
                  placeholder="Computed if off"
                />
              </div>
            </div>
          </div>

          <Button type="button" loading={previewing} onClick={() => void onPreview()}>
            {previewing ? 'Building…' : 'Build preview'}
          </Button>
        </section>
      ) : null}

      {preview ? (
        <PayslipPlaygroundDocument preview={preview} />
      ) : (
        <p className="text-sm text-muted" role="status">
          Choose month, working days, and LOP (and edit pay lines if needed), then build a preview. The
          slip stays empty until then.
        </p>
      )}
    </>
  );
}
