import type { CompOffAdjustment, CompOffWork } from '@/types/api';

export function compOffStatusLabel(status: CompOffWork['status']): string {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'CANCELLED') return 'Revoked';
  return 'Pending';
}

export function compOffTone(status: CompOffWork['status']): 'pending' | 'approved' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'rejected';
  return 'pending';
}

export function quantityLabel(quantity: number): string {
  return quantity === 0.5 ? 'Half day' : 'Full day';
}

export function waitingOnLabel(row: CompOffWork): string {
  if (row.status !== 'PENDING') return '—';
  if (row.waitingOn === 'PROJECT_LEAD') return 'Project lead';
  if (row.waitingOn === 'WORK_CONFIRM') return 'Work confirmation';
  if (row.waitingOn === 'HR') return 'HR';
  return 'Pending';
}

export function workKindLabel(row: CompOffWork): string {
  return row.kind === 'LEGACY_OFFSET' ? 'Offset leave' : 'Earn COMP';
}

export function creditLabel(row: CompOffWork): string {
  if (row.kind === 'LEGACY_OFFSET' && row.status === 'APPROVED') {
    return row.balanceRestored > 0 ? `Restored ${row.balanceRestored}` : 'Compensated';
  }
  if (row.status === 'APPROVED' && row.creditedQuantity > 0) {
    return `Credited ${quantityLabel(row.creditedQuantity)}`;
  }
  if (row.status === 'PENDING' && row.hrAccepted) return 'Waiting confirmation';
  return '—';
}

export function adjustmentBalanceLabel(row: CompOffAdjustment): string {
  if (row.status !== 'APPROVED') return '—';
  return `Used ${quantityLabel(row.compConsumed || row.quantity)}`;
}
