'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type ToastTone } from '@/store/slices/toast-slice';

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-success bg-background text-success shadow-card',
  error: 'border-danger bg-background text-danger shadow-card',
  warning: 'border-warning bg-background text-warning shadow-card',
};

const TONE_ICON: Record<ToastTone, 'check' | 'close' | 'bell'> = {
  success: 'check',
  error: 'close',
  warning: 'bell',
};

export function ToastHost() {
  const items = useAppSelector((state) => state.toast.items);
  const dispatch = useAppDispatch();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2 sm:right-6 sm:top-6">
      {items.map((item) => (
        <ToastCard
          key={item.id}
          id={item.id}
          tone={item.tone}
          message={item.message}
          onDismiss={() => dispatch(dismissToast(item.id))}
        />
      ))}
    </div>
  );
}

function ToastCard({
  id,
  tone,
  message,
  onDismiss,
}: {
  id: string;
  tone: ToastTone;
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss once per toast id
  }, [id]);

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-md border border-l-4 px-4 py-3 backdrop-blur-xl',
        TONE_CLASS[tone],
      )}
    >
      <Icon name={TONE_ICON[tone]} className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
        onClick={onDismiss}
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
