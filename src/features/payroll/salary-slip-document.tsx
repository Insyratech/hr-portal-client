'use client';

import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-300 py-1.5 text-sm text-black">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function SlipHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">{children}</p>
  );
}

/** Always white paper + black ink so print / PDF stays readable in any theme. */
export function SalarySlipDocument({ slip }: { slip: SalarySlip }) {
  const p = slip.particulars;
  return (
    <article
      id="salary-slip-print-root"
      className="mx-auto max-w-3xl border border-neutral-300 bg-white p-8 text-black shadow-none"
    >
      <header className="flex flex-wrap items-start gap-4 border-b border-neutral-300 pb-6">
        {slip.companyLogoUrl ? (
          <img src={slip.companyLogoUrl} alt="" className="h-16 w-16 object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center border border-neutral-300 text-xs text-neutral-500">
            Logo
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold tracking-tight text-black">{slip.companyName}</h1>
          <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{slip.companyAddress}</p>
        </div>
      </header>
      <p className="mt-6 text-center text-sm font-bold uppercase tracking-[0.16em] text-black">
        Salary slip · {slip.monthLabel}
      </p>

      <section className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-semibold text-black">Employee name: </span>
          {slip.employeeName}
        </p>
        <p>
          <span className="font-semibold text-black">Employee ID: </span>
          {slip.employeeCode}
        </p>
        <p>
          <span className="font-semibold text-black">Designation: </span>
          {slip.designationName ?? '—'}
        </p>
        <p>
          <span className="font-semibold text-black">Department: </span>
          {slip.departmentName ?? '—'}
        </p>
        <p>
          <span className="font-semibold text-black">PAN: </span>
          {slip.panMasked ?? '—'}
        </p>
        <p>
          <span className="font-semibold text-black">Bank: </span>
          {[slip.bankNameMasked, slip.bankAccountMasked].filter(Boolean).join(' · ') || '—'}
        </p>
        <p>
          <span className="font-semibold text-black">IFSC: </span>
          {slip.ifscMasked ?? '—'}
        </p>
      </section>

      <section className="mt-8">
        <SlipHeading>Leave particulars</SlipHeading>
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
          <SlipHeading>Income (₹)</SlipHeading>
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
          <SlipHeading>Deductions (₹)</SlipHeading>
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

      <p className="mt-8 border-t border-neutral-300 pt-4 text-right text-base font-bold text-black">
        Net pay {formatInr(slip.net)}
      </p>
      <p className="mt-1 text-right text-xs text-neutral-600">All amounts are in Indian Rupees (₹).</p>

      <footer className="mt-16 grid grid-cols-2 gap-8 text-sm text-neutral-700">
        <p className="border-t border-neutral-300 pt-2">Employee</p>
        <p className="border-t border-neutral-300 pt-2 text-right">Authorised signatory</p>
      </footer>
    </article>
  );
}
