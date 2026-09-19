import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT, FORM_FIELD_TONE, type AccentTone } from '@/lib/ui-accents';

export function Label({
  className,
  style,
  tone = FORM_FIELD_TONE,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { tone?: AccentTone }) {
  return (
    <label
      className={cn('mb-2 block text-xs uppercase tracking-[0.2em]', className)}
      style={{ color: ACCENT[tone], ...style }}
      {...props}
    />
  );
}
