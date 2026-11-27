'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { StatusMessage } from '@/components/ui/status-message';
import {
  INVENTORY_PERIOD_OPTIONS,
  inventoryMonthRange,
  queryFromPeriodSelection,
  type InventoryReportQuery,
} from '@/features/inventory/inventory-report-range';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useGetInventoryLogsQuery,
  useLazyExportInventoryLogsExcelQuery,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';
import type {
  InventoryLogInsideLabActivitySection,
  InventoryLogLabSubmissionRow,
  InventoryLogLotTransferRow,
  InventoryLogPlasticIssueRow,
  InventoryReportPeriod,
} from '@/types/api';

type PeriodSelection = InventoryReportPeriod | 'last_month';
type AreaTab = 'stock_room' | 'stationery' | 'inside_lab';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatComponents(row: InventoryLogLabSubmissionRow): string {
  return row.components
    .map((component) => {
      const qty =
        component.quantityValue === null || component.quantityValue === undefined
          ? ''
          : `${component.quantityValue}${component.quantityUnit ? ` ${component.quantityUnit}` : ''}`;
      const deducted =
        component.qtyDeducted === null || component.qtyDeducted === undefined
          ? ''
          : ` · deducted ${component.qtyDeducted}`;
      return `${component.name}${qty ? ` ${qty}` : ''}${deducted}`.trim();
    })
    .join(' · ');
}

function downloadBase64File(filename: string, base64: string, contentType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EmptyRows({ label }: { label: string }) {
  return <p className="px-3 py-4 text-sm text-muted">{label}</p>;
}

function LogTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/40 text-xs uppercase tracking-wide text-muted">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function PlasticIssuesTable({ rows }: { rows: InventoryLogPlasticIssueRow[] }) {
  if (!rows.length) return <EmptyRows label="No plastic take-outs in this period." />;
  return (
    <LogTable
      headers={['When', 'Employee', 'Item', 'Size', 'Boxes taken', 'Boxes left', 'Notes']}
    >
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-border/60 align-top">
          <td className="whitespace-nowrap px-3 py-2">{formatWhen(row.createdAt)}</td>
          <td className="px-3 py-2">
            {row.employeeName}
            {row.employeeCode ? (
              <span className="block text-xs text-muted">{row.employeeCode}</span>
            ) : null}
          </td>
          <td className="px-3 py-2">{row.itemName || '—'}</td>
          <td className="px-3 py-2">{row.sizeLabel || '—'}</td>
          <td className="px-3 py-2 tabular-nums">{row.boxes}</td>
          <td className="px-3 py-2 tabular-nums">{row.boxesAfter}</td>
          <td className="px-3 py-2 text-muted">{row.notes || '—'}</td>
        </tr>
      ))}
    </LogTable>
  );
}

function TransfersTable({ rows }: { rows: InventoryLogLotTransferRow[] }) {
  if (!rows.length) return <EmptyRows label="No lot transfers in this period." />;
  return (
    <LogTable headers={['When', 'Employee', 'Lot', 'Item', 'Qty', 'From → To', 'Notes']}>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-border/60 align-top">
          <td className="whitespace-nowrap px-3 py-2">{formatWhen(row.createdAt)}</td>
          <td className="px-3 py-2">
            {row.employeeName}
            {row.employeeCode ? (
              <span className="block text-xs text-muted">{row.employeeCode}</span>
            ) : null}
          </td>
          <td className="px-3 py-2 font-medium">{row.lotCode || '—'}</td>
          <td className="px-3 py-2">{row.itemName || '—'}</td>
          <td className="px-3 py-2 tabular-nums">
            {row.qty} {row.unit}
          </td>
          <td className="px-3 py-2">
            {row.fromArea} → {row.toArea}
          </td>
          <td className="px-3 py-2 text-muted">{row.notes || '—'}</td>
        </tr>
      ))}
    </LogTable>
  );
}

function LabActivitySection({ section }: { section: InventoryLogInsideLabActivitySection }) {
  const modeLabel =
    section.usageMode === 'gel'
      ? 'gel chart'
      : section.usageMode === 'method'
        ? 'methods'
        : 'recipes';

  const headers =
    section.usageMode === 'gel'
      ? ['When', 'Employee', 'Agarose %', 'Volume', 'Run', 'Components', 'Notes']
      : section.usageMode === 'method'
        ? ['When', 'Employee', 'Method', 'How many (Nx)', 'Components', 'Notes']
        : ['When', 'Employee', 'Recipe', 'Components', 'Output lot', 'Notes'];

  return (
    <section className="space-y-3 rounded border border-border p-4">
      <div>
        <h3 className="text-sm font-medium">{section.activityName}</h3>
        <p className="text-xs text-muted">
          {section.submissions.length} run{section.submissions.length === 1 ? '' : 's'} · {modeLabel}
        </p>
      </div>
      {!section.submissions.length ? (
        <EmptyRows label="No submissions for this work type in the selected period." />
      ) : (
        <LogTable headers={headers}>
          {section.submissions.map((row) => (
            <tr key={row.id} className="border-b border-border/60 align-top">
              <td className="whitespace-nowrap px-3 py-2">{formatWhen(row.createdAt)}</td>
              <td className="px-3 py-2">
                {row.employeeName}
                {row.employeeCode ? (
                  <span className="block text-xs text-muted">{row.employeeCode}</span>
                ) : null}
              </td>
              {section.usageMode === 'gel' ? (
                <>
                  <td className="px-3 py-2 tabular-nums">
                    {row.gelPercent != null ? `${row.gelPercent}%` : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.gelVolumeMl != null ? `${row.gelVolumeMl} mL` : '—'}
                  </td>
                  <td className="px-3 py-2">{row.runName || '—'}</td>
                  <td className="max-w-md px-3 py-2 text-muted">{formatComponents(row) || '—'}</td>
                  <td className="px-3 py-2 text-muted">{row.notes || '—'}</td>
                </>
              ) : section.usageMode === 'method' ? (
                <>
                  <td className="px-3 py-2">{row.runName || '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{row.quantityMultiplier}X</td>
                  <td className="max-w-md px-3 py-2 text-muted">{formatComponents(row) || '—'}</td>
                  <td className="px-3 py-2 text-muted">{row.notes || '—'}</td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2">{row.runName || '—'}</td>
                  <td className="max-w-md px-3 py-2 text-muted">{formatComponents(row) || '—'}</td>
                  <td className="px-3 py-2">{row.outputLotCode || '—'}</td>
                  <td className="px-3 py-2 text-muted">{row.notes || '—'}</td>
                </>
              )}
            </tr>
          ))}
        </LogTable>
      )}
    </section>
  );
}

export function InventoryLogsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.INVENTORY_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_OVERVIEW_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);

  const defaults = useMemo(() => inventoryMonthRange(-1), []);
  const [selection, setSelection] = useState<PeriodSelection>('last_month');
  const [customFrom, setCustomFrom] = useState(defaults.from);
  const [customTo, setCustomTo] = useState(defaults.to);
  const [applied, setApplied] = useState<InventoryReportQuery>(() =>
    queryFromPeriodSelection('last_month', defaults.from, defaults.to),
  );
  const [areaTab, setAreaTab] = useState<AreaTab>('inside_lab');
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useGetInventoryLogsQuery(applied, {
    skip: !canView,
  });
  const [exportExcel, { isFetching: exporting }] = useLazyExportInventoryLogsExcelQuery();
  const logs = data?.data;

  async function onExportExcel() {
    setExportError(null);
    try {
      const result = await exportExcel(applied).unwrap();
      downloadBase64File(
        result.data.filename,
        result.data.contentBase64,
        result.data.contentType,
      );
    } catch (cause) {
      setExportError(apiErrorMessage(cause, 'Unable to export Excel log.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Log" />
        <p className="text-sm text-muted">You need reports or lots permission to view deduction logs.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading || isFetching || exporting} />
      <PageHeader kicker="Inventory" title="Log" />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Track who took what from each usage-area QR. Stock room and Stationery show plastic take-outs
        (and Stock room chemical transfers). Inside lab is split by work type with columns matching the
        scan form. Download Excel for the same period.
      </p>

      <form
        className="mb-6 flex max-w-3xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(queryFromPeriodSelection(selection, customFrom, customTo));
        }}
      >
        <div className="min-w-[10rem]">
          <Label htmlFor="log-period">Period</Label>
          <select
            id="log-period"
            className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={selection}
            onChange={(event) => setSelection(event.target.value as PeriodSelection)}
          >
            {INVENTORY_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {selection === 'custom' ? (
          <>
            <div>
              <Label htmlFor="log-from">From</Label>
              <Input
                id="log-from"
                type="date"
                className="mt-1"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="log-to">To</Label>
              <Input
                id="log-to"
                type="date"
                className="mt-1"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                required
              />
            </div>
          </>
        ) : null}
        <Button type="submit">Load log</Button>
        <Button type="button" variant="outline" disabled={exporting} onClick={() => void onExportExcel()}>
          {exporting ? 'Exporting…' : 'Download Excel'}
        </Button>
      </form>

      {exportError ? <StatusMessage tone="danger">{exportError}</StatusMessage> : null}
      {isError ? (
        <StatusMessage tone="danger">Unable to load inventory logs.</StatusMessage>
      ) : null}

      {!logs && !isLoading ? (
        <p className="text-sm text-muted">Pick a period and load the log.</p>
      ) : null}

      {logs ? (
        <div className="space-y-6">
          <p className="text-xs text-muted">
            Showing {logs.range.label} ({logs.range.from} → {logs.range.to})
          </p>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['stock_room', logs.stockRoom.areaName],
                ['stationery', logs.stationery.areaName],
                ['inside_lab', logs.insideLab.areaName],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded border px-3 py-1.5 text-sm ${
                  areaTab === key
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-surface'
                }`}
                onClick={() => setAreaTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {areaTab === 'stock_room' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Meta>Plastic take-out</Meta>
                <p className="text-xs text-muted">
                  Matches the Stock room QR box take-out form (employee, item, boxes).
                </p>
                <PlasticIssuesTable rows={logs.stockRoom.plasticIssues} />
              </div>
              <div className="space-y-2">
                <Meta>Chemical / reagent transfer → Inside lab</Meta>
                <p className="text-xs text-muted">
                  Matches the Stock room transfer form (employee, lot moved into Inside lab).
                </p>
                <TransfersTable rows={logs.stockRoom.lotTransfers} />
              </div>
            </div>
          ) : null}

          {areaTab === 'stationery' ? (
            <div className="space-y-2">
              <Meta>Plastic take-out</Meta>
              <p className="text-xs text-muted">
                Matches the Stationery QR box take-out form (employee, item, boxes).
              </p>
              <PlasticIssuesTable rows={logs.stationery.plasticIssues} />
            </div>
          ) : null}

          {areaTab === 'inside_lab' ? (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                One section per work type. Columns follow the Inside lab scan fields for that mode
                (method + Nx, gel % + volume, or reagent recipe).
              </p>
              {logs.insideLab.byActivity.map((section) => (
                <LabActivitySection key={section.activityId} section={section} />
              ))}
              {!logs.insideLab.byActivity.length ? (
                <EmptyRows label="No lab work types configured yet." />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
