'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { StatusMessage } from '@/components/ui/status-message';
import { SELECT_CLASS } from '@/features/inventory/inventory-constants';
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

const PREVIEW_LIMIT = 5;

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

function LogTable({ headers, children }: { headers: string[]; children: ReactNode }) {
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

function matchesQuery(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

function PlasticIssueRows({ rows }: { rows: InventoryLogPlasticIssueRow[] }) {
  return (
    <>
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
    </>
  );
}

function TransferRows({ rows }: { rows: InventoryLogLotTransferRow[] }) {
  return (
    <>
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
    </>
  );
}

function LabSubmissionRows({
  rows,
  usageMode,
}: {
  rows: InventoryLogLabSubmissionRow[];
  usageMode: InventoryLogInsideLabActivitySection['usageMode'];
}) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-border/60 align-top">
          <td className="whitespace-nowrap px-3 py-2">{formatWhen(row.createdAt)}</td>
          <td className="px-3 py-2">
            {row.employeeName}
            {row.employeeCode ? (
              <span className="block text-xs text-muted">{row.employeeCode}</span>
            ) : null}
          </td>
          {usageMode === 'gel' ? (
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
          ) : usageMode === 'method' || usageMode === 'pcr' ? (
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
    </>
  );
}

function LogPreviewBlock({
  searchId,
  title,
  description,
  totalCount,
  emptyLabel,
  headers,
  previewBody,
  modalBody,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  searchId: string;
  title: string;
  description?: string;
  totalCount: number;
  emptyLabel: string;
  headers: string[];
  previewBody: ReactNode;
  modalBody: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const hasMore = totalCount > PREVIEW_LIMIT;

  return (
    <section className="space-y-3 rounded border border-border p-4">
      <div>
        <Meta>{title}</Meta>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        <p className="mt-1 text-xs text-muted">
          {totalCount} entr{totalCount === 1 ? 'y' : 'ies'} in this period
        </p>
      </div>

      {!totalCount ? (
        <EmptyRows label={emptyLabel} />
      ) : (
        <>
          <LogTable headers={headers}>{previewBody}</LogTable>
          {hasMore ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Showing recent {PREVIEW_LIMIT} of {totalCount}
              </p>
              <button
                type="button"
                className="text-sm underline-offset-2 hover:underline"
                onClick={() => setOpen(true)}
              >
                Show more
              </button>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-muted">
            Full log · {totalCount} entr{totalCount === 1 ? 'y' : 'ies'}
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor={searchId}>Search</Label>
              <Input
                id={searchId}
                className="mt-1"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
            <LogTable headers={headers}>{modalBody}</LogTable>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PlasticLogBlock({
  searchId,
  title,
  description,
  rows,
}: {
  searchId: string;
  title: string;
  description: string;
  rows: InventoryLogPlasticIssueRow[];
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        matchesQuery(
          [
            row.createdAt,
            row.employeeName,
            row.employeeCode,
            row.itemName,
            row.sizeLabel,
            String(row.boxes),
            row.notes,
          ].join(' '),
          search,
        ),
      ),
    [rows, search],
  );
  const headers = ['When', 'Employee', 'Item', 'Size', 'Boxes taken', 'Boxes left', 'Notes'];

  return (
    <LogPreviewBlock
      searchId={searchId}
      title={title}
      description={description}
      totalCount={rows.length}
      emptyLabel="No plastic take-outs in this period."
      headers={headers}
      previewBody={<PlasticIssueRows rows={rows.slice(0, PREVIEW_LIMIT)} />}
      modalBody={
        filtered.length ? (
          <PlasticIssueRows rows={filtered} />
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <EmptyRows label="No matches for that search." />
            </td>
          </tr>
        )
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search employee, item, size, notes…"
    />
  );
}

function TransferLogBlock({ rows }: { rows: InventoryLogLotTransferRow[] }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        matchesQuery(
          [
            row.createdAt,
            row.employeeName,
            row.employeeCode,
            row.lotCode,
            row.itemName,
            row.notes,
            row.fromArea,
            row.toArea,
          ].join(' '),
          search,
        ),
      ),
    [rows, search],
  );
  const headers = ['When', 'Employee', 'Lot', 'Item', 'Qty', 'From → To', 'Notes'];

  return (
    <LogPreviewBlock
      searchId="log-search-transfers"
      title="Chemical / reagent transfer → Inside lab"
      description="Matches the Stock room transfer form (employee, lot moved into Inside lab)."
      totalCount={rows.length}
      emptyLabel="No lot transfers in this period."
      headers={headers}
      previewBody={<TransferRows rows={rows.slice(0, PREVIEW_LIMIT)} />}
      modalBody={
        filtered.length ? (
          <TransferRows rows={filtered} />
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <EmptyRows label="No matches for that search." />
            </td>
          </tr>
        )
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search employee, lot, item, notes…"
    />
  );
}

function LabActivityLogBlock({ section }: { section: InventoryLogInsideLabActivitySection }) {
  const [search, setSearch] = useState('');
  const modeLabel =
    section.usageMode === 'gel'
      ? 'gel chart'
      : section.usageMode === 'pcr'
        ? 'master mixes'
        : section.usageMode === 'method'
          ? 'methods'
          : 'recipes';
  const headers =
    section.usageMode === 'gel'
      ? ['When', 'Employee', 'Agarose %', 'Volume', 'Run', 'Components', 'Notes']
      : section.usageMode === 'method' || section.usageMode === 'pcr'
        ? [
            'When',
            'Employee',
            section.usageMode === 'pcr' ? 'Master mix' : 'Method',
            section.usageMode === 'pcr' ? 'Reactions (Nx)' : 'How many (Nx)',
            'Components',
            'Notes',
          ]
        : ['When', 'Employee', 'Recipe', 'Components', 'Output lot', 'Notes'];

  const filtered = useMemo(
    () =>
      section.submissions.filter((row) =>
        matchesQuery(
          [
            row.createdAt,
            row.employeeName,
            row.employeeCode,
            row.runName,
            row.notes,
            row.outputLotCode,
            String(row.quantityMultiplier),
            row.gelPercent ?? '',
            row.gelVolumeMl ?? '',
            formatComponents(row),
          ].join(' '),
          search,
        ),
      ),
    [section.submissions, search],
  );

  return (
    <LogPreviewBlock
      searchId={`log-search-lab-${section.activityId}`}
      title={section.activityName}
      description={`${section.submissions.length} run${
        section.submissions.length === 1 ? '' : 's'
      } · ${modeLabel}`}
      totalCount={section.submissions.length}
      emptyLabel="No submissions for this work type in the selected period."
      headers={headers}
      previewBody={
        <LabSubmissionRows
          rows={section.submissions.slice(0, PREVIEW_LIMIT)}
          usageMode={section.usageMode}
        />
      }
      modalBody={
        filtered.length ? (
          <LabSubmissionRows rows={filtered} usageMode={section.usageMode} />
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <EmptyRows label="No matches for that search." />
            </td>
          </tr>
        )
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search employee, method/master mix/recipe, components, notes…"
    />
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
        Track who took what from each usage-area QR. Choose an area, browse the recent five entries per
        log type, then open Show more for the full searchable list. Download Excel for the same period.
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
            className={`${SELECT_CLASS} mt-1`}
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
        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          onClick={() => void onExportExcel()}
        >
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

          <div className="max-w-sm">
            <Label htmlFor="log-area">Usage area QR</Label>
            <select
              id="log-area"
              className={`${SELECT_CLASS} mt-1`}
              value={areaTab}
              onChange={(event) => setAreaTab(event.target.value as AreaTab)}
            >
              <option value="stock_room">{logs.stockRoom.areaName}</option>
              <option value="stationery">{logs.stationery.areaName}</option>
              <option value="inside_lab">{logs.insideLab.areaName}</option>
            </select>
          </div>

          {areaTab === 'stock_room' ? (
            <div className="space-y-4">
              <PlasticLogBlock
                searchId="log-search-stock-plastic"
                title="Plastic take-out"
                description="Matches the Stock room QR box take-out form (employee, item, boxes)."
                rows={logs.stockRoom.plasticIssues}
              />
              <TransferLogBlock rows={logs.stockRoom.lotTransfers} />
            </div>
          ) : null}

          {areaTab === 'stationery' ? (
            <PlasticLogBlock
              searchId="log-search-stationery-plastic"
              title="Plastic take-out"
              description="Matches the Stationery QR box take-out form (employee, item, boxes)."
              rows={logs.stationery.plasticIssues}
            />
          ) : null}

          {areaTab === 'inside_lab' ? (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                One section per work type. Recent five shown here; Show more opens the full searchable
                log for that type.
              </p>
              {logs.insideLab.byActivity.map((section) => (
                <LabActivityLogBlock key={section.activityId} section={section} />
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
