'use client';

import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <td className="border border-neutral-300 px-2 py-1 align-top text-[11px] leading-snug text-black">
      <span className="font-semibold">{label}</span> {value}
    </td>
  );
}

/** Always white paper + black ink so print / PDF stays readable in any theme. */
export function SalarySlipDocument({ slip }: { slip: SalarySlip }) {
  const p = slip.particulars;
  return (
    <article
      id="salary-slip-print-root"
      className="mx-auto w-full max-w-5xl border border-neutral-400 bg-white p-3 text-black shadow-none sm:p-4"
    >
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="w-[32%] border border-neutral-300 px-2 py-2 align-middle">
              {slip.companyLogoUrl ? (
                <img
                  src={slip.companyLogoUrl}
                  alt=""
                  className="max-h-14 max-w-full object-contain object-left"
                />
              ) : (
                <div className="flex h-12 items-center justify-center text-[11px] text-neutral-500">Logo</div>
              )}
            </td>
            <td className="border border-neutral-300 px-3 py-2 align-middle text-right">
              <p className="text-sm font-bold text-black">{slip.companyName}</p>
              <p className="mt-1 whitespace-pre-line text-[11px] leading-snug text-neutral-800">
                {slip.companyAddress}
              </p>
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-black">
              Salary slip
            </td>
            <td className="border border-neutral-300 px-2 py-1 text-center text-xs font-semibold text-black">
              Month · {slip.monthLabel}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <InfoCell label="Employee name:" value={slip.employeeName} />
            <InfoCell label="Employee ID:" value={slip.employeeCode} />
          </tr>
          <tr>
            <InfoCell label="Designation:" value={slip.designationName ?? '—'} />
            <InfoCell label="Date of joining:" value={slip.joiningDate ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="PAN:" value={slip.panMasked ?? '—'} />
            <InfoCell label="Bank name:" value={slip.bankNameMasked ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Account number:" value={slip.bankAccountMasked ?? '—'} />
            <InfoCell label="IFSC:" value={slip.ifscMasked ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Total days:" value={String(slip.calendarDays)} />
            <InfoCell label="Paid days:" value={String(slip.workingDays)} />
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              colSpan={4}
              className="border border-neutral-300 bg-neutral-50 px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-black"
            >
              Leave particulars
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">CL: {p.cl}</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">SL: {p.sl}</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">ML: {p.ml}</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">EL: {p.el}</td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">
              Maternity / Paternity: {p.maternityPaternity}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Miss punch: {p.missPunch}</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">
              Permissions: {p.permissionsCount} ({p.permissionHours}h)
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Late days: {p.lateDays}</td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Absent: {p.absent}</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px] font-semibold" colSpan={3}>
              Total LOPs: {p.totalLop}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[25%] border border-neutral-300 bg-neutral-50 px-2 py-1 text-left text-[11px] font-bold text-black">
              Income
            </th>
            <th className="w-[25%] border border-neutral-300 bg-neutral-50 px-2 py-1 text-right text-[11px] font-bold text-black">
              Amount (₹)
            </th>
            <th className="w-[25%] border border-neutral-300 bg-neutral-50 px-2 py-1 text-left text-[11px] font-bold text-black">
              Deductions
            </th>
            <th className="w-[25%] border border-neutral-300 bg-neutral-50 px-2 py-1 text-right text-[11px] font-bold text-black">
              Amount (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Basic</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.basic)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Professional tax</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.professionalTax)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">DA</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.da)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">TDS</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.tds)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">HRA</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.hra)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Welfare</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.employeeWelfare)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Fuel</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.fuel)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">KPI</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.kpi)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Incentives</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.incentives)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Other</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.otherDeductions)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">Other</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.other)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">
              Non-working days ({slip.nonWorkingDays})
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.nonWorkingAmount)}
            </td>
          </tr>
          <tr>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px] font-semibold">Gross</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] font-semibold tabular-nums">
              {formatInr(slip.gross)}
            </td>
            <td className="border border-neutral-300 px-2 py-0.5 text-[11px]">LOP</td>
            <td className="border border-neutral-300 px-2 py-0.5 text-right text-[11px] tabular-nums">
              {formatInr(slip.lopAmount)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-neutral-300 px-2 py-1 text-[11px] font-semibold">
              Net pay for the month
            </td>
            <td
              colSpan={2}
              className="border border-neutral-300 px-2 py-1 text-right text-sm font-bold tabular-nums"
            >
              {formatInr(slip.net)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-1 text-right text-[10px] text-neutral-600">All amounts are in Indian Rupees (₹).</p>

      <table className="mt-2 w-full border-collapse">
        <tbody>
          <tr>
            <td className="h-14 w-1/2 border border-neutral-300 px-2 py-1 align-bottom text-[11px] text-neutral-700">
              Employee signature
            </td>
            <td className="h-14 w-1/2 border border-neutral-300 px-2 py-1 align-bottom text-right text-[11px] text-neutral-700">
              Authorised signatory
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
