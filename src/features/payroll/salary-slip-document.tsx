'use client';

import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';
import { Meta } from '@/components/layout/meta';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function SalarySlipDocument({ slip }: { slip: SalarySlip }) {
  const p = slip.particulars;
  return (
    <article className="mx-auto max-w-3xl border border-border bg-background p-8 print:border-0 print:p-0">
      <header className="flex flex-wrap items-start gap-4 border-b border-border pb-6">
        {slip.companyLogoUrl ? (
          <img src={slip.companyLogoUrl} alt="" className="h-16 w-16 object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center border border-border text-xs text-muted">Logo</div>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{slip.companyName}</h1>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">{slip.companyAddress}</p>
        </div>
      </header>
      <p className="mt-6 text-center text-sm font-medium uppercase tracking-[0.16em]">Salary slip · {slip.monthLabel}</p>

      <section className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted">Employee: </span>
          {slip.employeeName} ({slip.employeeCode})
        </p>
        <p>
          <span className="text-muted">Designation: </span>
          {slip.designationName ?? '—'}
        </p>
        <p>
          <span className="text-muted">Department: </span>
          {slip.departmentName ?? '—'}
        </p>
        <p>
          <span className="text-muted">PAN: </span>
          {slip.panMasked ?? '—'}
        </p>
        <p>
          <span className="text-muted">Bank: </span>
          {slip.bankNameMasked ?? '—'} {slip.bankAccountMasked ?? ''}
        </p>
        <p>
          <span className="text-muted">IFSC: </span>
          {slip.ifscMasked ?? '—'}
        </p>
      </section>

      <section className="mt-8">
        <Meta>Leave particulars</Meta>
        <div className="mt-2 grid grid-cols-2 gap-x-8 sm:grid-cols-3">
          <Row label="CL" value={String(p.cl)} />
          <Row label="SL" value={String(p.sl)} />
          <Row label="ML" value={String(p.ml)} />
          <Row label="EL" value={String(p.el)} />
          <Row label="Maternity / Paternity" value={String(p.maternityPaternity)} />
          <Row label="Miss punch" value={String(p.missPunch)} />
          <Row label="Permissions" value={`${p.permissionsCount} (${p.permissionHours}h)`} />
          <Row label="Late days" value={String(p.lateDays)} />
          <Row label="Absent" value={String(p.absent)} />
          <Row label="Total LOPs" value={String(p.totalLop)} />
        </div>
      </section>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <Meta>Income</Meta>
          <div className="mt-2">
            <Row label="Basic" value={formatInr(slip.basic)} />
            <Row label="DA" value={formatInr(slip.da)} />
            <Row label="HRA" value={formatInr(slip.hra)} />
            <Row label="Fuel" value={formatInr(slip.fuel)} />
            <Row label="Incentives" value={formatInr(slip.incentives)} />
            <Row label="Other" value={formatInr(slip.other)} />
            <Row label="Gross" value={formatInr(slip.gross)} />
          </div>
        </div>
        <div>
          <Meta>Deductions</Meta>
          <div className="mt-2">
            <Row label="Professional tax" value={formatInr(slip.professionalTax)} />
            <Row label="TDS" value={formatInr(slip.tds)} />
            <Row label="Welfare" value={formatInr(slip.employeeWelfare)} />
            <Row label="KPI" value={formatInr(slip.kpi)} />
            <Row label="Other" value={formatInr(slip.otherDeductions)} />
            <Row label={`LOP (${slip.lopDays} × ${formatInr(slip.dailyRate)})`} value={formatInr(slip.lopAmount)} />
          </div>
        </div>
      </section>

      <p className="mt-8 border-t border-border pt-4 text-right text-base font-semibold">Net pay {formatInr(slip.net)}</p>

      <footer className="mt-16 grid grid-cols-2 gap-8 text-sm text-muted">
        <p className="border-t border-border pt-2">Employee</p>
        <p className="border-t border-border pt-2 text-right">Authorised signatory</p>
      </footer>
    </article>
  );
}
