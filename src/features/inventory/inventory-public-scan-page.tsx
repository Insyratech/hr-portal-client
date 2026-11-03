'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetInventoryPublicScanQuery,
  useIssueInventoryPublicPlasticBatchMutation,
  useIssueInventoryPublicScanMutation,
} from '@/store/api/api';
import type { InventoryPublicLotScanCard, InventoryPublicStationCard } from '@/types/api';

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="mb-4 rounded border border-border bg-surface px-3 py-2 text-sm">
      <p className="font-medium">You are offline</p>
      <p className="mt-1 text-muted">
        Connect to lab Wi‑Fi, then refresh. Usage is not recorded while offline — do not assume stock
        was deducted.
      </p>
    </div>
  );
}

/**
 * Public usage card: lot (measured) or station (plastic picker).
 * No ERP login and no IM usage grant required — pick an active employee and submit.
 */
export function InventoryPublicScanPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token ?? '');
  const online = useOnlineStatus();
  const { data, isLoading, isError, error, refetch, isFetching } = useGetInventoryPublicScanQuery(
    token,
    { skip: !token },
  );
  const payload = data?.data;

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-lg font-medium">Invalid scan</h1>
        <p className="mt-2 text-sm text-muted">This QR link is incomplete.</p>
        <p className="mt-4 text-sm">
          <Link href="/scan" className="underline-offset-2 hover:underline">
            Open camera scanner
          </Link>
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <OfflineBanner online={online} />
        <p className="text-sm text-muted">Loading stock card…</p>
      </main>
    );
  }

  if (isError || !payload) {
    const offlineFail = !online;
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <OfflineBanner online={online} />
        <h1 className="text-lg font-medium">{offlineFail ? 'Cannot reach inventory' : 'Unknown QR'}</h1>
        <p className="mt-2 text-sm text-muted">
          {offlineFail
            ? 'This device has no network. Reconnect and try again — nothing was recorded.'
            : apiErrorMessage(error, 'This label is invalid or no longer available.')}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="underline-offset-2 hover:underline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Retry
          </button>
          <Link href="/scan" className="underline-offset-2 hover:underline">
            Scan another label
          </Link>
        </div>
      </main>
    );
  }

  if (payload.kind === 'station') {
    return (
      <StationScanCard token={token} card={payload} online={online} onDone={() => void refetch()} />
    );
  }

  return <LotScanCard token={token} card={payload} online={online} onDone={() => void refetch()} />;
}

function LotScanCard({
  token,
  card,
  online,
  onDone,
}: {
  token: string;
  card: InventoryPublicLotScanCard | Omit<InventoryPublicLotScanCard, 'kind'>;
  online: boolean;
  onDone: () => void;
}) {
  const [issue, { isLoading: submitting }] = useIssueInventoryPublicScanMutation();
  const [employeeId, setEmployeeId] = useState('');
  const [qty, setQty] = useState<number | null>(null);
  const [customQty, setCustomQty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedQty = useMemo(() => {
    if (customQty.trim()) {
      const parsed = Number(customQty);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return qty;
  }, [customQty, qty]);

  async function onSubmit() {
    setError(null);
    setSuccess(null);
    if (!online) {
      setError('You are offline. Connect to the network before submitting — usage was not recorded.');
      return;
    }
    if (!employeeId) {
      setError('Select your name.');
      return;
    }
    if (selectedQty == null || selectedQty <= 0) {
      setError('Choose a quantity.');
      return;
    }
    try {
      const result = await issue({
        token,
        body: { employeeId, qty: selectedQty },
      }).unwrap();
      setSuccess(
        `Recorded ${result.data.qtyIssued} ${result.data.unit} for ${result.data.employeeName}. Remaining ${result.data.remainingQty} ${result.data.unit}.`,
      );
      setQty(null);
      setCustomQty('');
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — usage was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to submit usage.'));
    }
  }

  const depleted = card.status === 'depleted' || card.remainingQty <= 0;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <OfflineBanner online={online} />
      <p className="text-xs uppercase tracking-[0.2em] text-meta">Lab inventory</p>
      <h1 className="mt-2 text-xl font-medium">{card.itemName}</h1>
      <p className="mt-1 text-sm text-muted">{card.categoryName}</p>
      <dl className="mt-4 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Lot</dt>
        <dd>{card.lotCode}</dd>
        <dt className="text-muted">Cat. no.</dt>
        <dd>{card.catalogNumber?.trim() || '—'}</dd>
        <dt className="text-muted">Expiry</dt>
        <dd>{card.expiryDate || '—'}</dd>
        <dt className="text-muted">Opened</dt>
        <dd>{card.openedOn || '—'}</dd>
        <dt className="text-muted">{card.madeLabel ?? 'Mfg'}</dt>
        <dd>{card.madeOn || '—'}</dd>
        <dt className="text-muted">Store</dt>
        <dd>{card.locationName}</dd>
      </dl>
      <p className="mt-4 text-2xl font-medium tabular-nums">
        {card.remainingQty}{' '}
        <span className="text-sm font-normal text-muted">{card.unit} left</span>
      </p>

      {depleted ? (
        <p className="mt-6 text-sm text-danger">This lot is empty.</p>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="employeeId">1. Your name</Label>
            <select
              id="employeeId"
              className={SELECT_CLASS}
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">Select employee</option>
              {card.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>2. Quantity ({card.unit})</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {card.qtyChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`rounded border px-3 py-2 text-sm tabular-nums ${
                    qty === chip && !customQty.trim()
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background'
                  }`}
                  onClick={() => {
                    setQty(chip);
                    setCustomQty('');
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Label htmlFor="customQty">Or enter amount</Label>
              <Input
                id="customQty"
                type="number"
                min={0.0001}
                step="any"
                value={customQty}
                onChange={(event) => {
                  setCustomQty(event.target.value);
                  setQty(null);
                }}
                placeholder={`Max ${card.remainingQty}`}
              />
            </div>
          </div>

          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

          <Button
            type="button"
            className="w-full"
            disabled={submitting || !online}
            onClick={() => void onSubmit()}
          >
            {submitting ? 'Submitting…' : '3. Submit'}
          </Button>
          <p className="text-xs text-muted">
            No login needed. Pick your name and quantity — usage is recorded against that employee.
          </p>
          <p className="text-xs text-muted">
            <Link href="/scan" className="underline-offset-2 hover:underline">
              Scan another label with camera
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}

type DraftPlasticLine = {
  key: string;
  plasticStockId: string;
  boxes: number | null;
  custom: string;
};

function emptyPlasticLine(): DraftPlasticLine {
  return { key: crypto.randomUUID(), plasticStockId: '', boxes: null, custom: '' };
}

function StationScanCard({
  token,
  card,
  online,
  onDone,
}: {
  token: string;
  card: InventoryPublicStationCard;
  online: boolean;
  onDone: () => void;
}) {
  const [issueBatch, { isLoading: submitting }] = useIssueInventoryPublicPlasticBatchMutation();
  const [employeeId, setEmployeeId] = useState('');
  const [lines, setLines] = useState<DraftPlasticLine[]>([emptyPlasticLine()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateLine(key: string, patch: Partial<DraftPlasticLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function onSubmit() {
    setError(null);
    setSuccess(null);
    if (!online) {
      setError('You are offline. Connect to the network before submitting — usage was not recorded.');
      return;
    }
    if (!employeeId) {
      setError('Select your name.');
      return;
    }
    const parsed = lines.map((line) => {
      const custom = line.custom.trim();
      const boxes = custom ? Math.trunc(Number(custom)) : line.boxes;
      return { plasticStockId: line.plasticStockId, boxes };
    });
    if (parsed.some((line) => !line.plasticStockId)) {
      setError('Choose an item on every row, or remove the empty row.');
      return;
    }
    if (parsed.some((line) => line.boxes == null || !Number.isFinite(line.boxes) || line.boxes <= 0)) {
      setError('Enter how many boxes for each item.');
      return;
    }
    const ids = parsed.map((line) => line.plasticStockId);
    if (new Set(ids).size !== ids.length) {
      setError('Each item can be entered once. Combine the boxes on one row.');
      return;
    }
    try {
      const result = await issueBatch({
        token,
        body: {
          employeeId,
          lines: parsed.map((line) => ({ plasticStockId: line.plasticStockId, boxes: line.boxes as number })),
        },
      }).unwrap();
      const summary = result.data.lines
        .map((line) => `${line.boxesIssued} ${line.unit} of ${line.itemName} (${line.sizeLabel})`)
        .join('; ');
      setSuccess(`Recorded for ${result.data.employeeName}: ${summary}.`);
      setLines([emptyPlasticLine()]);
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — usage was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to submit usage.'));
      onDone();
    }
  }

  const empty = card.items.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <OfflineBanner online={online} />
      <p className="text-xs uppercase tracking-[0.2em] text-meta">{card.categoryName || 'Station'}</p>
      <h1 className="mt-2 text-xl font-medium">{card.stationName}</h1>
      <dl className="mt-4 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Store</dt>
        <dd>{card.locationName}</dd>
        <dt className="text-muted">QR</dt>
        <dd>One code for this room</dd>
      </dl>
      <p className="mt-3 text-sm text-muted">Add every item you take, then submit once.</p>

      {empty ? (
        <p className="mt-6 text-sm text-danger">No plastic boxes left at this station.</p>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="employeeId">1. Your name</Label>
            <select
              id="employeeId"
              className={SELECT_CLASS}
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">Select employee</option>
              {card.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>2. Items</Label>
              <button
                type="button"
                className="text-sm underline-offset-2 hover:underline"
                onClick={() => setLines((current) => (current.length >= 12 ? current : [...current, emptyPlasticLine()]))}
              >
                Add item
              </button>
            </div>
            {lines.map((line, index) => {
              const selected = card.items.find((item) => item.id === line.plasticStockId);
              const takenElsewhere = new Set(
                lines.filter((other) => other.key !== line.key && other.plasticStockId).map((other) => other.plasticStockId),
              );
              return (
                <div key={line.key} className="space-y-3 rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">Item {index + 1}</p>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <select
                    className={SELECT_CLASS}
                    value={line.plasticStockId}
                    onChange={(event) =>
                      updateLine(line.key, { plasticStockId: event.target.value, boxes: null, custom: '' })
                    }
                  >
                    <option value="">Select item</option>
                    {card.items.map((item) => (
                      <option key={item.id} value={item.id} disabled={takenElsewhere.has(item.id)}>
                        {item.itemName} · {item.sizeLabel}
                        {item.manufacturer ? ` · ${item.manufacturer}` : ''} ({item.boxesOnHand} {item.unit})
                      </option>
                    ))}
                  </select>
                  {selected ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {selected.qtyChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className={`rounded border px-3 py-2 text-sm tabular-nums ${
                              line.boxes === chip && !line.custom.trim()
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-background'
                            }`}
                            onClick={() => updateLine(line.key, { boxes: chip, custom: '' })}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={line.custom}
                        onChange={(event) => updateLine(line.key, { custom: event.target.value, boxes: null })}
                        placeholder={`Boxes, max ${selected.boxesOnHand}`}
                      />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

          <Button type="button" className="w-full" disabled={submitting || !online} onClick={() => void onSubmit()}>
            {submitting ? 'Submitting…' : '3. Submit all'}
          </Button>
          <p className="text-xs text-muted">
            No login needed. One name covers every item on this visit.
          </p>
          <p className="text-xs text-muted">
            <Link href="/scan" className="underline-offset-2 hover:underline">
              Scan another label with camera
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
