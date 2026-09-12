'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  leaveBalanceTone,
  leaveBalanceToneStroke,
  leaveBalanceToneTextClass,
} from '@/features/leave/leave-balance-tone';
import { cn } from '@/lib/utils';

const SIZE = 112;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type LeaveBalanceRingProps = {
  code: string;
  available: number;
  allocated: number;
  className?: string;
};

/**
 * One ring segment per allocated day; colored segments equal remaining balance.
 * Tone/colors unchanged — only segment count follows entitlement.
 */
export function LeaveBalanceRing({ code, available, allocated, className }: LeaveBalanceRingProps) {
  const remaining = Math.max(0, Number(available) || 0);
  const total = Math.max(0, Number(allocated) || 0);
  const tone = leaveBalanceTone(remaining, total);

  const segments = Math.max(0, Math.round(total));
  const filledTarget = Math.min(segments, Math.max(0, Math.round(remaining)));
  const [filled, setFilled] = useState(0);
  const active = leaveBalanceToneStroke(tone);
  const idle = 'color-mix(in srgb, var(--muted) 35%, transparent)';

  const { segmentArc, gap } = useMemo(() => {
    if (segments <= 0) return { segmentArc: 0, gap: 0 };
    // Keep a visible notch between pieces; shrink gap when entitlement is large.
    const gapRatio = Math.min(0.045, 0.4 / segments);
    const nextGap = CIRCUMFERENCE * gapRatio;
    return {
      gap: nextGap,
      segmentArc: CIRCUMFERENCE / segments - nextGap,
    };
  }, [segments]);

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
  }, [filledTarget, code, segments]);

  const stepDelayMs = segments > 0 ? Math.min(45, Math.floor(420 / segments)) : 0;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{code}</p>
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={`${code}: ${remaining} out of ${total} is balance (${segments} day pieces, ${filledTarget} colored)`}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
          {segments > 0
            ? Array.from({ length: segments }, (_, index) => {
                const offset = index * (segmentArc + gap);
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
                    strokeDasharray={`${segmentArc} ${CIRCUMFERENCE - segmentArc}`}
                    strokeDashoffset={-offset}
                    className="transition-[stroke] duration-500 ease-out"
                    style={{
                      transitionDelay: isOn ? `${index * stepDelayMs}ms` : '0ms',
                    }}
                  />
                );
              })
            : (
                <circle
                  cx={CX}
                  cy={CY}
                  r={RADIUS}
                  fill="none"
                  stroke={idle}
                  strokeWidth={STROKE}
                />
              )}
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
