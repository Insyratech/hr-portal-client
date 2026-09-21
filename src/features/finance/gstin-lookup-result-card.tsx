'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Meta } from '@/components/layout/meta';
import { cn } from '@/lib/utils';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import type { GstinLookupResult } from '@/types/api';

function LookupField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded border border-border bg-surface/60 px-3 py-2.5', className)}>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={cn('mt-1 break-words text-sm text-foreground', mono && 'font-mono tracking-wide')}>
        {value}
      </p>
    </div>
  );
}

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : '—';
}

type GstinLookupResultCardProps = {
  result: GstinLookupResult;
  onAutoFill: () => void;
  onManual: () => void;
  autoFillLabel?: string;
  manualLabel?: string;
  hint?: string;
  className?: string;
};

/** Elevated card for GSTIN decode / master lookup — matches finance KPI card chrome. */
export function GstinLookupResultCard({
  result,
  onAutoFill,
  onManual,
  autoFillLabel = 'Auto-fill fields',
  manualLabel = 'Fill manually',
  hint = 'Auto-fill still lets you edit every field on later steps. Fill manually keeps the GSTIN and leaves identity/address empty for you to complete.',
  className,
}: GstinLookupResultCardProps) {
  const stateLabel = result.stateName
    ? `${result.stateName} (${result.stateCode})`
    : result.stateCode ?? '—';
  const sourceLabel =
    result.source === 'gst_network'
      ? 'From GST network'
      : result.source === 'customer_master'
        ? 'From customer master'
        : result.source === 'vendor_master'
          ? 'From vendor master'
          : result.source === 'gst_profile'
            ? 'From GST registration'
            : result.source === 'org_master'
              ? 'From organisation profile'
              : 'Decoded from GSTIN';

  const addressPreview =
    [result.addressLine1, result.addressLine2, result.city, result.postalCode]
      .filter((part) => part?.trim())
      .join(', ') || result.billingAddress;

  return (
    <section
      className={cn(
        'mt-4 overflow-hidden rounded border border-border bg-background shadow-card',
        className,
      )}
      style={{ borderTopWidth: 3, borderTopColor: ACCENT[FORM_SECTION_TONE] }}
      aria-label="GSTIN lookup result"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-surface"
            style={{ color: ACCENT[FORM_SECTION_TONE] }}
            aria-hidden
          >
            <Icon name="badge" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Meta tone="purple">Lookup result</Meta>
            <p className="mt-1 text-sm text-foreground">{result.message}</p>
          </div>
        </div>
        <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          {sourceLabel}
        </span>
      </div>

      <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
        <LookupField label="GSTIN" value={displayValue(result.gstin)} mono />
        <LookupField label="State" value={stateLabel} />
        <LookupField label="Company / legal name" value={displayValue(result.legalName)} />
        <LookupField label="Trade name" value={displayValue(result.tradeName)} />
        <LookupField label="PAN" value={displayValue(result.pan)} mono />
        <LookupField label="CIN" value={displayValue(result.cin)} mono />
        <LookupField
          label="Address"
          value={displayValue(addressPreview)}
          className="sm:col-span-2"
        />
        {(result.city || result.postalCode) && (
          <>
            <LookupField label="City" value={displayValue(result.city)} />
            <LookupField label="Postal code" value={displayValue(result.postalCode)} mono />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-surface/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="max-w-md text-xs text-muted">{hint}</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onAutoFill}>
            {autoFillLabel}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onManual}>
            {manualLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
