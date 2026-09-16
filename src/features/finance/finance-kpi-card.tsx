import { Meta } from '@/components/layout/meta';
import { CHART } from '@/features/reports/chart-theme';
import { cn } from '@/lib/utils';

export type FinanceKpiAccent = 'cyan' | 'amber' | 'emerald' | 'rose' | 'violet' | 'sky';

const ACCENT_COLOR: Record<FinanceKpiAccent, string> = {
  cyan: '#22d3ee',
  sky: CHART.sky,
  amber: CHART.amber,
  emerald: CHART.emerald,
  rose: CHART.rose,
  violet: CHART.violet,
};

export function FinanceKpiCard({
  title,
  value,
  secondary,
  accent,
  trend = null,
  /** When true, upward movement is bad (e.g. payables / overdue). */
  invertTrend = false,
  priorLabel,
  className,
}: {
  title: string;
  value: string;
  secondary?: string;
  accent: FinanceKpiAccent;
  trend?: 'up' | 'down' | 'flat' | null;
  invertTrend?: boolean;
  priorLabel?: string;
  className?: string;
}) {
  const color = ACCENT_COLOR[accent];
  const goodUp = invertTrend ? trend === 'down' : trend === 'up';
  const badUp = invertTrend ? trend === 'up' : trend === 'down';
  const trendTone = goodUp ? 'text-success' : badUp ? 'text-danger' : 'text-muted';
  const trendGlyph = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : null;

  return (
    <div
      className={cn(
        'rounded border border-border bg-background p-4 shadow-card sm:p-5',
        className,
      )}
      style={{ borderTopWidth: 3, borderTopColor: color }}
    >
      <Meta>{title}</Meta>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      {secondary ? <p className="mt-1.5 text-xs text-muted">{secondary}</p> : null}
      {trendGlyph || priorLabel ? (
        <p className={cn('mt-2 flex flex-wrap items-center gap-1.5 text-xs', trendTone)}>
          {trendGlyph ? <span aria-hidden>{trendGlyph}</span> : null}
          {priorLabel ? <span className="text-muted">{priorLabel}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

export function kpiTrend(current: number, prior: number): 'up' | 'down' | 'flat' {
  const delta = current - prior;
  if (Math.abs(delta) < 0.005) return 'flat';
  return delta > 0 ? 'up' : 'down';
}
