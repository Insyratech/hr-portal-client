'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/** Extract inventory kiosk token from a scanned QR payload (full URL or raw token). */
export function extractInventoryScanToken(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/scan\/([^/]+)\/?$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    // Not a full URL — fall through.
  }

  const pathMatch = value.match(/(?:^|\/)scan\/([^/?#]+)/i);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);

  // Raw token (uuid-like or opaque string without spaces/slashes)
  if (/^[A-Za-z0-9_-]{8,128}$/.test(value) && !value.includes('/')) {
    return value;
  }

  return null;
}

type Props = {
  onToken: (token: string) => void;
  className?: string;
};

type ScannerHandle = {
  start: (
    cameraIdOrConfig: string | MediaTrackConstraints,
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decoded: string) => void,
    onFailure?: (error: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

export function InventoryQrScanner({ onToken, className }: Props) {
  const elementId = useId().replace(/:/g, '');
  const scannerRef = useRef<ScannerHandle | null>(null);
  const handledRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        void scanner
          .stop()
          .catch(() => undefined)
          .then(() => {
            try {
              scanner.clear();
            } catch {
              // ignore
            }
          });
      }
    };
  }, []);

  async function start() {
    setError(null);
    setHint(null);
    handledRef.current = false;

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('Camera scanning needs HTTPS (or localhost). Open this portal over a secure link.');
      return;
    }

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        }) as unknown as ScannerHandle;
      }
      const scanner = scannerRef.current;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (handledRef.current) return;
          const token = extractInventoryScanToken(decoded);
          if (!token) {
            setHint('QR read, but it is not an inventory label. Point at a lot or station QR.');
            return;
          }
          handledRef.current = true;
          void scanner
            .stop()
            .catch(() => undefined)
            .then(() => {
              setRunning(false);
              onToken(token);
            });
        },
        () => undefined,
      );
      setRunning(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to open camera.';
      setError(
        /NotAllowedError|Permission/i.test(message)
          ? 'Camera permission denied. Allow camera access for this site, then try again.'
          : /NotFoundError|DevicesNotFound/i.test(message)
            ? 'No camera found on this device.'
            : message,
      );
      setRunning(false);
    }
  }

  async function stop() {
    const scanner = scannerRef.current;
    if (!scanner) {
      setRunning(false);
      return;
    }
    try {
      await scanner.stop();
    } catch {
      // already stopped
    }
    setRunning(false);
  }

  return (
    <div className={className}>
      <div
        id={elementId}
        className="overflow-hidden rounded border border-border bg-black/5 [&_video]:max-h-72 [&_video]:w-full [&_video]:object-cover"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {running ? (
          <Button type="button" variant="outline" onClick={() => void stop()}>
            Stop camera
          </Button>
        ) : (
          <Button type="button" onClick={() => void start()}>
            Scan with camera
          </Button>
        )}
      </div>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {!running && !error ? (
        <p className="mt-2 text-xs text-muted">
          Opens the rear camera in this browser — no separate QR app needed. Point at a printed lot or
          station label.
        </p>
      ) : null}
    </div>
  );
}
