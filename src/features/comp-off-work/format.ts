import type { CompOffWork } from '@/types/api';

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
