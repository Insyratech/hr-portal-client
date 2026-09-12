/** Shared leave-balance UX tone: colors the remaining (balance) number and ring fill. */

export type LeaveBalanceTone = 'exhausted' | 'critical' | 'healthy' | 'low';

/**
 * - exhausted (0 left) → gray
 * - critical (1–2 left) → red
 * - healthy (≥50% remaining) → green
 * - low (>2 left but under 50%) → amber
 */
export function leaveBalanceTone(available: number, allocated: number): LeaveBalanceTone {
  const remaining = Math.max(0, Number(available) || 0);
  const total = Math.max(0, Number(allocated) || 0);

  if (remaining <= 0) return 'exhausted';
  if (remaining === 1 || remaining === 2) return 'critical';
  if (total <= 0) return 'healthy';
  const ratio = remaining / total;
  if (ratio >= 0.5) return 'healthy';
  return 'low';
}

export function leaveBalanceToneTextClass(tone: LeaveBalanceTone): string {
  switch (tone) {
    case 'exhausted':
      return 'text-muted';
    case 'critical':
      return 'text-[color:var(--danger)]';
    case 'healthy':
      return 'text-[color:var(--success)]';
    case 'low':
      return 'text-[color:var(--warning)]';
  }
}

export function leaveBalanceToneStroke(tone: LeaveBalanceTone): string {
  switch (tone) {
    case 'exhausted':
      return 'var(--muted)';
    case 'critical':
      return 'var(--danger)';
    case 'healthy':
      return 'var(--success)';
    case 'low':
      return 'var(--warning)';
  }
}
