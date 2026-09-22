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
  useIssueInventoryPublicPlasticMutation,
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
 * Public 3-click usage card: lot (measured) or station (plastic picker).
 * No ERP login required; authorization checked for the selected employee.
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
      <p className="mt-1 text-sm text-muted">
        {card.categoryName} · {card.lotCode} · {card.locationName}
      </p>
      <p className="mt-4 text-2xl font-medium tabular-nums">
        {card.remainingQty}{' '}
        <span className="text-sm font-normal text-muted">{card.unit} left</span>
      </p>
      {card.expiryDate ? <p className="mt-1 text-xs text-muted">Expiry {card.expiryDate}</p> : null}

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
            Only employees authorized by Inventory Manager can submit. Ask IM if you see an
            authorization error.
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
  const [issue, { isLoading: submitting }] = useIssueInventoryPublicPlasticMutation();
  const [employeeId, setEmployeeId] = useState('');
  const [plasticStockId, setPlasticStockId] = useState('');
  const [boxes, setBoxes] = useState<number | null>(null);
  const [customBoxes, setCustomBoxes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedItem = card.items.find((item) => item.id === plasticStockId);

  const selectedBoxes = useMemo(() => {
    if (customBoxes.trim()) {
      const parsed = Number(customBoxes);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    }
    return boxes;
  }, [customBoxes, boxes]);

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
    if (!plasticStockId) {
      setError('Select an item.');
      return;
    }
    if (selectedBoxes == null || selectedBoxes <= 0) {
      setError('Choose how many boxes.');
      return;
    }
    try {
      const result = await issue({
        token,
        body: { employeeId, plasticStockId, boxes: selectedBoxes },
      }).unwrap();
      setSuccess(
        `Recorded ${result.data.boxesIssued} ${result.data.unit} of ${result.data.itemName} (${result.data.sizeLabel}) for ${result.data.employeeName}. Remaining ${result.data.boxesOnHand} ${result.data.unit}.`,
      );
      setBoxes(null);
      setCustomBoxes('');
      onDone();
    } catch (cause) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('You are offline. Connect to the network before submitting — usage was not recorded.');
        return;
      }
      setError(apiErrorMessage(cause, 'Unable to submit usage.'));
    }
  }

  const empty = card.items.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <OfflineBanner online={online} />
      <p className="text-xs uppercase tracking-[0.2em] text-meta">Lab inventory</p>
      <h1 className="mt-2 text-xl font-medium">{card.stationName}</h1>
      <p className="mt-1 text-sm text-muted">{card.locationName} · plastic station</p>

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

          <div>
            <Label htmlFor="plasticStockId">2. Item (type + size)</Label>
            <select
              id="plasticStockId"
              className={SELECT_CLASS}
              value={plasticStockId}
              onChange={(event) => {
                setPlasticStockId(event.target.value);
                setBoxes(null);
                setCustomBoxes('');
              }}
            >
              <option value="">Select item</option>
              {card.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName} · {item.sizeLabel}
                  {item.manufacturer ? ` · ${item.manufacturer}` : ''} ({item.boxesOnHand}{' '}
                  {item.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedItem ? (
            <div>
              <Label>3. Boxes</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedItem.qtyChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`rounded border px-3 py-2 text-sm tabular-nums ${
                      boxes === chip && !customBoxes.trim()
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background'
                    }`}
                    onClick={() => {
                      setBoxes(chip);
                      setCustomBoxes('');
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="customBoxes">Or enter boxes</Label>
                <Input
                  id="customBoxes"
                  type="number"
                  min={1}
                  step={1}
                  value={customBoxes}
                  onChange={(event) => {
                    setCustomBoxes(event.target.value);
                    setBoxes(null);
                  }}
                  placeholder={`Max ${selectedItem.boxesOnHand}`}
                />
              </div>
            </div>
          ) : null}

          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

          <Button
            type="button"
            className="w-full"
            disabled={submitting || !selectedItem || !online}
            onClick={() => void onSubmit()}
          >
            {submitting ? 'Submitting…' : '4. Submit'}
          </Button>
          <p className="text-xs text-muted">
            Only employees authorized by Inventory Manager can submit. Ask IM if you see an
            authorization error.
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
