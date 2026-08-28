import type { PayrollCompensationParts } from '@/types/api';

export const PAYROLL_FIXED_EARNINGS = [
  { key: 'basic', label: 'Basic' },
  { key: 'da', label: 'DA' },
  { key: 'hra', label: 'HRA' },
  { key: 'fuel', label: 'Fuel' },
] as const satisfies ReadonlyArray<{ key: keyof PayrollCompensationParts; label: string }>;

export const PAYROLL_VARIABLE_EARNINGS = [
  { key: 'incentives', label: 'Incentives' },
  { key: 'other', label: 'Other earnings' },
] as const satisfies ReadonlyArray<{ key: keyof PayrollCompensationParts; label: string }>;

export const PAYROLL_VARIABLE_DEDUCTIONS = [
  { key: 'professionalTax', label: 'Professional tax' },
  { key: 'tds', label: 'TDS' },
  { key: 'employeeWelfare', label: 'Employee welfare' },
  { key: 'kpi', label: 'KPI' },
  { key: 'otherDeductions', label: 'Other deductions' },
] as const satisfies ReadonlyArray<{ key: keyof PayrollCompensationParts; label: string }>;

export type PayrollEditableKey =
  | (typeof PAYROLL_VARIABLE_EARNINGS)[number]['key']
  | (typeof PAYROLL_VARIABLE_DEDUCTIONS)[number]['key'];

export type PayrollEditableValues = Pick<PayrollCompensationParts, PayrollEditableKey>;

export function editableFromCompensation(compensation: PayrollCompensationParts): PayrollEditableValues {
  return {
    incentives: compensation.incentives,
    other: compensation.other,
    professionalTax: compensation.professionalTax,
    tds: compensation.tds,
    employeeWelfare: compensation.employeeWelfare,
    kpi: compensation.kpi,
    otherDeductions: compensation.otherDeductions,
  };
}

export function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
