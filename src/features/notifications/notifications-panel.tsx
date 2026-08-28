'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/icon';
import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { pathForNotification } from '@/features/notifications/notification-path';
import { cn } from '@/lib/utils';
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotificationsOpen } from '@/store/slices/ui-slice';
import type { NotificationItem } from '@/types/api';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function notificationIcon(item: NotificationItem): IconName {
  const ref = item.referenceType ?? '';
  if (ref.includes('leave')) return 'leave';
  if (ref.includes('grievance')) return 'shield';
  if (ref.includes('attendance') || ref.includes('work_permission')) return 'clock';
  if (ref.includes('payroll') || ref.includes('salary')) return 'file';
  if (ref.includes('work') || ref.includes('project') || ref.includes('weekly')) return 'grid';
  return 'bell';
}

export function NotificationsPanel() {
  const open = useAppSelector((state) => state.ui.notificationsOpen);
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGetNotificationsQuery(
    { unread: true },
    {
      skip: !open,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !open,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: true,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const items = data?.data ?? [];
  const totalUnread = unreadData?.data.count ?? items.length;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dispatch(setNotificationsOpen(false));
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-notifications-trigger]')) return;
      dispatch(setNotificationsOpen(false));
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [dispatch, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="hr-panel-in absolute right-4 top-[calc(100%+0.35rem)] z-50 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-lg border border-border bg-background shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)] md:right-8"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/60 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <Icon name="bell" className="h-4 w-4 opacity-80" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            <p className="text-xs text-muted">
              {totalUnread > 0
                ? `${totalUnread} unread`
                : isLoading
                  ? 'Loading…'
                  : 'All caught up'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {items.length > 0 ? (
            <button
              type="button"
              disabled={markingAll}
              className="text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
              onClick={() => void markAll()}
            >
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Close notifications"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted transition-colors hover:border-border hover:bg-background hover:text-foreground"
            onClick={() => dispatch(setNotificationsOpen(false))}
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ul className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain">
        {isLoading ? (
          <li className="flex justify-center px-4 py-14">
            <ThreeDotsSpinner label="Loading notifications" />
          </li>
        ) : items.length === 0 ? (
          <li className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border bg-surface">
              <Icon name="bell" className="h-5 w-5 text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-muted">No unread notifications right now.</p>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface/80"
                onClick={() => {
                  if (item.unread) void markRead(item.id);
                  dispatch(setNotificationsOpen(false));
                  router.push(pathForNotification(item, roles));
                }}
              >
                <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors group-hover:border-foreground/20 group-hover:bg-background">
                  <Icon name={notificationIcon(item)} className="h-4 w-4 opacity-80" />
                  {item.unread ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-foreground ring-2 ring-background"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm leading-snug',
                      item.unread ? 'font-medium text-foreground' : 'text-muted',
                    )}
                  >
                    {item.title}
                  </p>
                  {item.message && item.message !== item.title ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted">{formatRelativeTime(item.createdAt)}</p>
                </div>
                <Icon
                  name="chevron-right"
                  className="mt-2 h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-70"
                />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
