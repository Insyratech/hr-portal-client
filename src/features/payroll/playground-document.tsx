'use client';

import type { PayslipPlaygroundPreview } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

const cell = 'border border-black';
const head = 'border border-black bg-neutral-50';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <td className={`${cell} px-2 py-1 align-top text-[11px] leading-snug text-black`}>
      <span className="font-semibold">{label}</span> {value}
    </td>
  );
}

function MoneyCell({ value }: { value: number }) {
  return <td className={`${cell} px-2 py-0.5 text-right text-[11px] tabular-nums`}>{formatInr(value)}</td>;
}

/** Excel-style new-regime playground slip. Ephemeral — not a published salary slip. */
export function PayslipPlaygroundDocument({ preview }: { preview: PayslipPlaygroundPreview }) {
  const tax = preview.tax;
  const maxRows = Math.max(preview.earnings.length, preview.deductions.length);

  return (
    <article
      id="payslip-playground-print-root"
      className={`mx-auto w-full max-w-5xl ${cell} bg-white p-2 text-black shadow-none sm:p-3`}
    >
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`w-[34%] ${cell} px-2 py-2 align-middle`}>
              {preview.company.logoUrl ? (
                <img
                  src={preview.company.logoUrl}
                  alt=""
                  className="max-h-14 max-w-full object-contain object-left"
                />
              ) : (
                <div className="flex h-12 items-center justify-center text-[11px] text-neutral-500">Logo</div>
              )}
            </td>
            <td className={`${cell} px-3 py-2 align-middle text-right`}>
              <p className="whitespace-pre-line text-[11px] leading-snug text-neutral-800">
                {preview.company.address}
              </p>
              <p className="mt-1 text-sm font-bold text-black">{preview.company.name}</p>
            </td>
          </tr>
          <tr>
            <td className={`${head} px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-black`}>
              Salary slip · playground
            </td>
            <td className={`${head} px-2 py-1 text-center text-xs font-semibold text-black`}>
              Month · {preview.monthLabel} · FY {preview.financialYear} · New regime
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <InfoCell label="Employee name:" value={preview.employee.fullName} />
            <InfoCell label="PAN:" value={preview.payment.pan ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Employee ID:" value={preview.employee.employeeCode} />
            <InfoCell label="Account number:" value={preview.payment.bankAccountNumber ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Designation:" value={preview.employee.designationName ?? '—'} />
            <InfoCell label="Bank name:" value={preview.payment.bankName ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Date of joining:" value={preview.employee.joiningDate ?? '—'} />
            <InfoCell label="IFSC:" value={preview.payment.ifsc ?? '—'} />
          </tr>
          <tr>
            <InfoCell label="Department:" value={preview.employee.departmentName ?? '—'} />
            <td className={`${cell} px-2 py-1 text-[11px] text-black`} />
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              colSpan={4}
              className={`${head} px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-black`}
            >
              Attendance
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>
              Calendar days: {preview.attendance.calendarDays}
            </td>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>
              Working / paid days: {preview.attendance.workingDays}
            </td>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>
              Non-working: {preview.attendance.nonWorkingDays}
            </td>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>LOP: {preview.attendance.lopDays}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${head} px-2 py-1 text-center text-[11px] font-bold text-black`} colSpan={3}>
              Income
            </th>
            <th className={`${head} px-2 py-1 text-center text-[11px] font-bold text-black`} colSpan={3}>
              Deductions
            </th>
          </tr>
          <tr>
            <th className={`w-[18%] ${head} px-2 py-0.5 text-left text-[11px] font-semibold`}>Particulars</th>
            <th className={`w-[16%] ${head} px-2 py-0.5 text-right text-[11px] font-semibold`}>Amount (₹)</th>
            <th className={`w-[16%] ${head} px-2 py-0.5 text-right text-[11px] font-semibold`}>YTD (₹)</th>
            <th className={`w-[18%] ${head} px-2 py-0.5 text-left text-[11px] font-semibold`}>Particulars</th>
            <th className={`w-[16%] ${head} px-2 py-0.5 text-right text-[11px] font-semibold`}>Amount (₹)</th>
            <th className={`w-[16%] ${head} px-2 py-0.5 text-right text-[11px] font-semibold`}>YTD (₹)</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, i) => {
            const earn = preview.earnings[i];
            const ded = preview.deductions[i];
            return (
              <tr key={i}>
                <td className={`${cell} px-2 py-0.5 text-[11px]`}>{earn?.label ?? ''}</td>
                {earn ? <MoneyCell value={earn.amount} /> : <td className={cell} />}
                {earn ? <MoneyCell value={earn.ytd} /> : <td className={cell} />}
                <td className={`${cell} px-2 py-0.5 text-[11px]`}>{ded?.label ?? ''}</td>
                {ded ? <MoneyCell value={ded.amount} /> : <td className={cell} />}
                {ded ? <MoneyCell value={ded.ytd} /> : <td className={cell} />}
              </tr>
            );
          })}
          <tr>
            <td className={`${cell} px-2 py-1 text-[11px] font-semibold`} colSpan={1}>
              Gross pay
            </td>
            <MoneyCell value={preview.gross} />
            <MoneyCell value={preview.grossYtd} />
            <td className={`${cell} px-2 py-1 text-[11px] font-bold`} colSpan={1}>
              Net pay for the month
            </td>
            <td className={`${cell} px-2 py-1 text-right text-sm font-bold tabular-nums`} colSpan={2}>
              {formatInr(preview.net)}
            </td>
          </tr>
          <tr>
            <td className={`${cell} px-2 py-1 text-[11px]`} colSpan={6}>
              <span className="font-semibold">Net pay in words:</span> {preview.netInWords}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              colSpan={5}
              className={`${head} px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-black`}
            >
              Leave particulars
            </th>
          </tr>
          <tr>
            <th className={`${head} px-2 py-0.5 text-left text-[11px]`}>Type</th>
            <th className={`${head} px-2 py-0.5 text-right text-[11px]`}>Opening</th>
            <th className={`${head} px-2 py-0.5 text-right text-[11px]`}>Accrued</th>
            <th className={`${head} px-2 py-0.5 text-right text-[11px]`}>Availed</th>
            <th className={`${head} px-2 py-0.5 text-right text-[11px]`}>Closing</th>
          </tr>
        </thead>
        <tbody>
          {preview.leave.length === 0 ? (
            <tr>
              <td className={`${cell} px-2 py-0.5 text-[11px] text-neutral-600`} colSpan={5}>
                No leave allocations for this calendar year.
              </td>
            </tr>
          ) : (
            preview.leave.map((row) => (
              <tr key={`${row.code}-${row.name}`}>
                <td className={`${cell} px-2 py-0.5 text-[11px]`}>
                  {row.code ? `${row.code} · ${row.name}` : row.name}
                </td>
                <td className={`${cell} px-2 py-0.5 text-right text-[11px] tabular-nums`}>{row.opening}</td>
                <td className={`${cell} px-2 py-0.5 text-right text-[11px] tabular-nums`}>{row.accrued}</td>
                <td className={`${cell} px-2 py-0.5 text-right text-[11px] tabular-nums`}>{row.availed}</td>
                <td className={`${cell} px-2 py-0.5 text-right text-[11px] tabular-nums`}>{row.closing}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              colSpan={2}
              className={`${head} px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-black`}
            >
              Income tax · New regime · FY {preview.financialYear}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Projected annual gross</td>
            <MoneyCell value={tax.annualGrossSalary} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Standard deduction</td>
            <MoneyCell value={tax.standardDeduction} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Other income</td>
            <MoneyCell value={tax.otherIncome} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px] font-semibold`}>Taxable income</td>
            <MoneyCell value={tax.taxableIncome} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Tax on total income</td>
            <MoneyCell value={tax.taxOnTotalIncome} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Rebate u/s 87A</td>
            <MoneyCell value={tax.rebate87A} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>
              Surcharge{tax.surchargeRate > 0 ? ` (${Math.round(tax.surchargeRate * 100)}%)` : ''}
            </td>
            <MoneyCell value={tax.surcharge} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Health & education cess (4%)</td>
            <MoneyCell value={tax.cess} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Relief u/s 89</td>
            <MoneyCell value={tax.relief89} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px] font-semibold`}>Net annual tax</td>
            <MoneyCell value={tax.netAnnualTax} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Tax deducted till previous month</td>
            <MoneyCell value={tax.taxDeductedTillPreviousMonth} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Balance tax</td>
            <MoneyCell value={tax.balanceTax} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>
              Months left (incl. this) · TDS this month ({preview.tdsSource})
            </td>
            <MoneyCell value={tax.tdsThisMonth} />
          </tr>
          <tr>
            <td className={`${cell} px-2 py-0.5 text-[11px]`}>Tax remaining after this month</td>
            <MoneyCell value={tax.taxRemainingAfterThisMonth} />
          </tr>
        </tbody>
      </table>

      {preview.ytd.slipCount === 0 ? (
        <p className="mt-1 text-[10px] text-neutral-600">
          YTD = ₹0 — no published slips in FY {preview.financialYear} before {preview.monthLabel} (Apr
          → prior month{preview.employee.joiningDate ? ', on/after joining' : ''}).
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-neutral-600">
          YTD from {preview.ytd.slipCount} published slip(s) in FY {preview.financialYear}:{' '}
          {preview.ytd.periods.join(', ')}.
        </p>
      )}
      <p className="text-right text-[10px] text-neutral-600">
        Ephemeral preview — refresh loses edits. Not a published payslip.
      </p>
    </article>
  );
}
