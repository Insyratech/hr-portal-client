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
  useGetInventoryPublicLabRecipesQuery,
  useGetInventoryPublicScanQuery,
  useIssueInventoryPublicPlasticBatchMutation,
  useIssueInventoryPublicScanMutation,
  useSubmitInventoryPublicLabUsageMutation,
  useTransferInventoryPublicInsideLabMutation,
} from '@/store/api/api';
import type {
  InventoryPublicCentralCard,
  InventoryPublicCentralLabCard,
  InventoryPublicCentralLotItem,
  InventoryPublicLotScanCard,
  InventoryPublicStationCard,
  InventoryPublicStationItem,
} from '@/types/api';

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

  if (payload.kind === 'central_lab') {
    return (
      <LabScanCard token={token} card={payload} online={online} onDone={() => void refetch()} />
    );
  }

  if (payload.kind === 'central') {
    return (
      <CentralScanCard token={token} card={payload} online={online} onDone={() => void refetch()} />
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
  const issueDisabled = Boolean(card.issueDisabled);

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

      {issueDisabled ? (
        <div className="mt-6 space-y-3">
          <StatusMessage tone="danger">
            {card.issueDisabledMessage ??
              'Bottle QRs no longer record usage. Scan a usage area QR instead.'}
          </StatusMessage>
          <p className="text-sm">
            <Link href="/scan" className="underline-offset-2 hover:underline">
              Open camera scanner
            </Link>
          </p>
        </div>
      ) : depleted ? (
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

function CentralScanCard({
  token,
  card,
  online,
  onDone,
}: {
  token: string;
  card: InventoryPublicCentralCard;
  online: boolean;
  onDone: () => void;
}) {
  const [transferLot, { isLoading: transferringLot }] = useTransferInventoryPublicInsideLabMutation();
  const [issueBatch, { isLoading: issuingPlastic }] = useIssueInventoryPublicPlasticBatchMutation();
  const [employeeId, setEmployeeId] = useState('');
  const [mode, setMode] = useState<'transfer' | 'box'>(card.lots.length > 0 ? 'transfer' : 'box');
  const [lotId, setLotId] = useState('');
  const [lines, setLines] = useState<DraftPlasticLine[]>([emptyPlasticLine()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLot: InventoryPublicCentralLotItem | undefined = card.lots.find((lot) => lot.id === lotId);

  const empty = card.lots.length === 0 && card.plasticItems.length === 0;
  const submitting = transferringLot || issuingPlastic;
  const showTransfer =
    card.centralKind === 'stock_room' &&
    (mode === 'transfer' || card.plasticItems.length === 0) &&
    card.lots.length > 0;

  function updateLine(key: string, patch: Partial<DraftPlasticLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function onSubmitTransfer() {
    setError(null);
    setSuccess(null);
    if (!online) {
      setError('You are offline. Connect to the network before submitting — transfer was not recorded.');
      return;
    }
    if (!employeeId) {
      setError('Select your name.');
      return;
    }
    if (!lotId) {
      setError('Select a chemical or reagent lot to transfer.');
      return;
    }
    try {
      const result = await transferLot({
        token,
        body: { employeeId, lotId },
      }).unwrap();
      setSuccess(
        `Transferred ${result.data.itemName} (${result.data.lotCode}) ${result.data.fromArea} → ${result.data.toArea}. On hand ${result.data.remainingQty} ${result.data.unit}.`,
      );
      setLotId('');
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — transfer was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to transfer lot.'));
    }
  }

  async function onSubmitPlastic() {
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
          lines: parsed.map((line) => ({
            plasticStockId: line.plasticStockId,
            boxes: line.boxes!,
          })),
        },
      }).unwrap();
      const summary = result.data.lines
        .map((line) => `${line.boxesIssued} ${line.unit} · ${line.itemName}`)
        .join('; ');
      setSuccess(`Recorded for ${result.data.employeeName}: ${summary}`);
      setLines([emptyPlasticLine()]);
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — usage was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to submit usage.'));
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <OfflineBanner online={online} />
      <p className="text-xs uppercase tracking-[0.2em] text-meta">Lab inventory</p>
      <h1 className="mt-2 text-xl font-medium">{card.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {card.centralKind === 'stock_room'
          ? 'Stock room — take out plastic boxes, or transfer chemicals/reagents to Inside lab'
          : 'Stationery take-out'}
      </p>

      {empty ? (
        <p className="mt-6 text-sm text-muted">Nothing is attached to this usage area yet.</p>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="central-employee">1. Your name</Label>
            <select
              id="central-employee"
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

          {card.centralKind === 'stock_room' && card.lots.length > 0 && card.plasticItems.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded border px-3 py-2 text-sm ${
                  mode === 'transfer'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background'
                }`}
                onClick={() => setMode('transfer')}
              >
                Transfer to Inside lab
              </button>
              <button
                type="button"
                className={`rounded border px-3 py-2 text-sm ${
                  mode === 'box'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background'
                }`}
                onClick={() => setMode('box')}
              >
                Plastic boxes
              </button>
            </div>
          ) : null}

          {showTransfer ? (
            <>
              <div>
                <Label htmlFor="central-lot">2. Chemical / reagent lot</Label>
                <select
                  id="central-lot"
                  className={SELECT_CLASS}
                  value={lotId}
                  onChange={(event) => setLotId(event.target.value)}
                >
                  <option value="">Select lot</option>
                  {card.lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.itemName} · {lot.lotCode} ({lot.remainingQty} {lot.unit})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">
                  Moves the whole lot to Inside lab. Quantity is not consumed here.
                </p>
              </div>
              {selectedLot ? (
                <p className="text-sm text-muted">
                  Will transfer {selectedLot.remainingQty} {selectedLot.unit} on hand to Inside lab.
                </p>
              ) : null}
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
              <Button
                type="button"
                className="w-full"
                disabled={submitting || !online}
                onClick={() => void onSubmitTransfer()}
              >
                {submitting ? 'Transferring…' : 'Transfer to Inside lab'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label>2. Items</Label>
                  <button
                    type="button"
                    className="text-sm underline-offset-2 hover:underline"
                    onClick={() =>
                      setLines((current) =>
                        current.length >= 12 ? current : [...current, emptyPlasticLine()],
                      )
                    }
                  >
                    Add item
                  </button>
                </div>
                {lines.map((line, index) => {
                  const selected: InventoryPublicStationItem | undefined = card.plasticItems.find(
                    (item) => item.id === line.plasticStockId,
                  );
                  const takenElsewhere = new Set(
                    lines
                      .filter((other) => other.key !== line.key && other.plasticStockId)
                      .map((other) => other.plasticStockId),
                  );
                  return (
                    <div key={line.key} className="space-y-3 rounded border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted">Item {index + 1}</p>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            className="text-xs underline-offset-2 hover:underline"
                            onClick={() =>
                              setLines((current) => current.filter((item) => item.key !== line.key))
                            }
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <select
                        className={SELECT_CLASS}
                        value={line.plasticStockId}
                        onChange={(event) =>
                          updateLine(line.key, {
                            plasticStockId: event.target.value,
                            boxes: null,
                            custom: '',
                          })
                        }
                      >
                        <option value="">Select item</option>
                        {card.plasticItems.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={takenElsewhere.has(item.id)}
                          >
                            {item.itemName} · {item.sizeLabel}
                            {item.manufacturer ? ` · ${item.manufacturer}` : ''} ({item.boxesOnHand}{' '}
                            {item.unit})
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
                            onChange={(event) =>
                              updateLine(line.key, { custom: event.target.value, boxes: null })
                            }
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
              <Button
                type="button"
                className="w-full"
                disabled={submitting || !online}
                onClick={() => void onSubmitPlastic()}
              >
                {submitting ? 'Submitting…' : 'Submit all'}
              </Button>
            </>
          )}

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

function LabScanCard({
  token,
  card,
  online,
  onDone,
}: {
  token: string;
  card: InventoryPublicCentralLabCard;
  online: boolean;
  onDone: () => void;
}) {
  const [submitUsage, { isLoading: submitting }] = useSubmitInventoryPublicLabUsageMutation();
  const [employeeId, setEmployeeId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [outputQty, setOutputQty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [components, setComponents] = useState<
    Array<{
      key: string;
      name: string;
      quantityValue: string;
      quantityUnit: string;
      notes: string;
      catalogItemId: string | null;
    }>
  >([]);

  const { data: recipesData, isFetching: loadingRecipes } = useGetInventoryPublicLabRecipesQuery(
    activityId,
    { skip: !activityId },
  );
  const recipes = recipesData?.data ?? [];
  const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);

  useEffect(() => {
    setRecipeId('');
    setComponents([]);
    setOutputQty('');
  }, [activityId]);

  useEffect(() => {
    if (!selectedRecipe) {
      setComponents([]);
      setOutputQty('');
      return;
    }
    setOutputQty(
      selectedRecipe.finalVolumeValue != null ? String(selectedRecipe.finalVolumeValue) : '',
    );
    setComponents(
      selectedRecipe.components.map((component) => ({
        key: component.id,
        name: component.name,
        quantityValue:
          component.quantityValue === null || component.quantityValue === undefined
            ? ''
            : String(component.quantityValue),
        quantityUnit: component.quantityUnit,
        notes: component.notes,
        catalogItemId: component.catalogItemId,
      })),
    );
  }, [selectedRecipe]);

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
    if (!activityId) {
      setError('Select what you are doing.');
      return;
    }
    if (!recipeId) {
      setError('Select a recipe / type.');
      return;
    }
    const lines = components
      .map((row) => {
        const qtyRaw = row.quantityValue.trim();
        return {
          name: row.name.trim(),
          quantityValue: qtyRaw ? Number(qtyRaw) : null,
          quantityUnit: row.quantityUnit.trim(),
          notes: row.notes.trim(),
          catalogItemId: row.catalogItemId,
        };
      })
      .filter((row) => row.name);
    if (!lines.length) {
      setError('Add at least one component.');
      return;
    }
    if (lines.some((row) => row.quantityValue !== null && !Number.isFinite(row.quantityValue))) {
      setError('Component quantities must be numbers (or blank).');
      return;
    }
    try {
      const result = await submitUsage({
        token,
        body: {
          employeeId,
          activityId,
          recipeId,
          outputQty: outputQty.trim() ? Number(outputQty) : null,
          components: lines,
        },
      }).unwrap();
      const deducted = result.data.components.filter((line) => line.qtyDeducted != null).length;
      setSuccess(
        `Recorded ${result.data.activityName} · ${result.data.recipeName} for ${result.data.employeeName} (${result.data.employeeCode}).${
          result.data.outputLotCode ? ` New lot ${result.data.outputLotCode}.` : ''
        }${deducted ? ` Deducted ${deducted} linked component(s).` : ''}`,
      );
      setRecipeId('');
      setComponents([]);
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — usage was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to submit lab usage.'));
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <OfflineBanner online={online} />
      <p className="text-xs uppercase tracking-[0.2em] text-meta">Lab inventory</p>
      <h1 className="mt-2 text-xl font-medium">{card.name}</h1>
      <p className="mt-1 text-sm text-muted">{card.message}</p>

      {!card.activities.length ? (
        <p className="mt-6 text-sm text-muted">
          No work types yet. Ask Inventory Manager to add them under Lab recipes.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="lab-employee">Employee</Label>
            <select
              id="lab-employee"
              className={SELECT_CLASS}
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">Select name (ID)</option>
              {card.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="lab-activity">What are you doing?</Label>
            <select
              id="lab-activity"
              className={SELECT_CLASS}
              value={activityId}
              onChange={(event) => setActivityId(event.target.value)}
            >
              <option value="">Select work type</option>
              {card.activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>

          {activityId ? (
            <div>
              <Label htmlFor="lab-recipe">Recipe / type</Label>
              <select
                id="lab-recipe"
                className={SELECT_CLASS}
                value={recipeId}
                onChange={(event) => setRecipeId(event.target.value)}
                disabled={loadingRecipes}
              >
                <option value="">{loadingRecipes ? 'Loading…' : 'Select recipe'}</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                    {recipe.finalVolumeValue != null
                      ? ` (${recipe.finalVolumeValue} ${recipe.finalVolumeUnit})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selectedRecipe ? (
            <>
              {selectedRecipe.createsOutputLot ? (
                <div>
                  <Label htmlFor="lab-output-qty">
                    Output qty ({selectedRecipe.finalVolumeUnit || selectedRecipe.outputCatalogItemName || 'units'})
                  </Label>
                  <Input
                    id="lab-output-qty"
                    type="number"
                    min={0.0001}
                    step="any"
                    value={outputQty}
                    onChange={(event) => setOutputQty(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="space-y-3">
                <Label>Components (editable)</Label>
                {components.map((component, index) => (
                  <div key={component.key} className="space-y-2 rounded border border-border p-3">
                    <p className="text-sm font-medium">{component.name || `Component ${index + 1}`}</p>
                    <div className="grid grid-cols-[1fr_5rem] gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={component.quantityValue}
                        onChange={(event) =>
                          setComponents((current) =>
                            current.map((row) =>
                              row.key === component.key
                                ? { ...row, quantityValue: event.target.value }
                                : row,
                            ),
                          )
                        }
                        placeholder="Qty"
                      />
                      <Input
                        value={component.quantityUnit}
                        onChange={(event) =>
                          setComponents((current) =>
                            current.map((row) =>
                              row.key === component.key
                                ? { ...row, quantityUnit: event.target.value }
                                : row,
                            ),
                          )
                        }
                        placeholder="Unit"
                      />
                    </div>
                    {component.notes ? <p className="text-xs text-muted">{component.notes}</p> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

          <Button
            type="button"
            className="w-full"
            disabled={submitting || !online || !recipeId}
            onClick={() => void onSubmit()}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
          <p className="text-xs text-muted">
            Linked components deduct stock from Inside lab. Reagent recipes can also create a new lot.
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
