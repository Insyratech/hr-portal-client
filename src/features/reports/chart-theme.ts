import type { CSSProperties } from 'react';

/** Chart palette that works on light and dark portal themes. */
export const CHART = {
  teal: '#2dd4bf',
  sky: '#38bdf8',
  amber: '#fbbf24',
  rose: '#fb7185',
  violet: '#a78bfa',
  emerald: '#34d399',
  indigo: '#818cf8',
  slate: '#94a3b8',
} as const;

export const CHART_SERIES = [
  CHART.teal,
  CHART.sky,
  CHART.amber,
  CHART.violet,
  CHART.rose,
  CHART.emerald,
  CHART.indigo,
  CHART.slate,
] as const;

export function chartTooltipStyle(isDark: boolean): {
  contentStyle: CSSProperties;
  labelStyle: CSSProperties;
  itemStyle: CSSProperties;
} {
  return {
    contentStyle: {
      background: isDark ? '#0a0a0a' : '#ffffff',
      border: `1px solid ${isDark ? '#262626' : '#d4d4d4'}`,
      borderRadius: 8,
      boxShadow: 'none',
      fontSize: 12,
    },
    labelStyle: { color: isDark ? '#f5f5f5' : '#111111', marginBottom: 4 },
    itemStyle: { color: isDark ? '#a3a3a3' : '#737373' },
  };
}
