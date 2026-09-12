'use client';

import { useEffect, useState } from 'react';
import {
  leaveBalanceTone,
  leaveBalanceToneStroke,
  leaveBalanceToneTextClass,
  leaveRemainingPercent,
} from '@/features/leave/leave-balance-tone';
import { cn } from '@/lib/utils';

const SEGMENTS = 10;
const SIZE = 112;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = CIRCUMFERENCE * 0.028;
const SEGMENT_ARC = CIRCUMFERENCE / SEGMENTS - GAP;

type LeaveBalanceRingProps = {
  code: string;
  available: number;
  allocated: number;
  className?: string;
};

/** Segmented circular meter — filled by remaining %, number colored by UX tone. */
export function LeaveBalanceRing({ code, available, allocated, className }: LeaveBalanceRingProps) {
  const remaining = Math.max(0, Number(available) || 0);
  const total = Math.max(0, Number(allocated) || 0);
  const tone = leaveBalanceTone(remaining, total);
  const pct = leaveRemainingPercent(remaining, total);
  const filledTarget = Math.round((pct / 100) * SEGMENTS);
  const [filled, setFilled] = useState(0);
  const active = leaveBalanceToneStroke(tone);
  const idle = 'color-mix(in srgb, var(--muted) 35%, transparent)';

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFilled(filledTarget);
      return;
    }
    setFilled(0);
    const timer = window.setTimeout(() => setFilled(filledTarget), 40);
    return () => window.clearTimeout(timer);
  }, [filledTarget, code]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{code}</p>
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={`${code}: ${remaining} out of ${total} is balance (${pct}% remaining)`}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
          {Array.from({ length: SEGMENTS }, (_, index) => {
            const offset = index * (SEGMENT_ARC + GAP);
            const isOn = index < filled;
            return (
              <circle
                key={index}
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={isOn ? active : idle}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${SEGMENT_ARC} ${CIRCUMFERENCE - SEGMENT_ARC}`}
                strokeDashoffset={-offset}
                className="transition-[stroke] duration-500 ease-out"
                style={{
                  transitionDelay: isOn ? `${index * 45}ms` : '0ms',
                }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums tracking-tight transition-colors duration-300',
              leaveBalanceToneTextClass(tone),
            )}
          >
            {remaining}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
            of {total}
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-muted">is balance</p>
    </div>
  );
}
