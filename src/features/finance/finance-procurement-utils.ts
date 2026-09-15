import type { StatusTone } from '@/components/dashboard/status-badge';
import type { FinanceAccount } from '@/types/api';

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function procurementStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (
    normalized === 'approved' ||
    normalized === 'issued' ||
    normalized === 'posted' ||
    normalized === 'selected' ||
    normalized === 'received' ||
    normalized === 'converted' ||
    normalized === 'paid' ||
    normalized === 'matched' ||
    normalized === 'reimbursed'
  ) {
    return 'approved';
  }
  if (
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'closed' ||
    normalized === 'mismatch' ||
    normalized === 'overdue' ||
    normalized === 'void' ||
    normalized === 'excluded'
  ) {
    return 'rejected';
  }
  // draft, submitted, unmatched, categorized, and other in-progress statuses
  return 'pending';
}

/** Status tones for sales documents (quotes, SOs, DNs, invoices, payments, credits). */
export function salesStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (
    normalized === 'accepted' ||
    normalized === 'confirmed' ||
    normalized === 'delivered' ||
    normalized === 'invoiced' ||
    normalized === 'converted' ||
    normalized === 'posted' ||
    normalized === 'paid' ||
    normalized === 'sent'
  ) {
    return 'approved';
  }
  if (
    normalized === 'declined' ||
    normalized === 'expired' ||
    normalized === 'void' ||
    normalized === 'cancelled' ||
    normalized === 'overdue'
  ) {
    return 'rejected';
  }
  return 'pending';
}

export function isBankAccount(account: FinanceAccount): boolean {
  const role = (account.systemRole ?? '').toLowerCase();
  const name = account.name.toLowerCase();
  return role === 'bank' || name.includes('bank');
}

export function isCashAccount(account: FinanceAccount): boolean {
  const role = (account.systemRole ?? '').toLowerCase();
  const name = account.name.toLowerCase();
  return role === 'cash' || name.includes('cash');
}

export type IndentLineDraft = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  estimatedRate: string;
};

export type MoneyLineDraft = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  taxPercent: string;
};

export function newIndentLine(): IndentLineDraft {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: '1',
    unit: 'nos',
    estimatedRate: '0',
  };
}

export function newMoneyLine(): MoneyLineDraft {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: '1',
    unit: 'nos',
    rate: '0',
    taxPercent: '18',
  };
}
