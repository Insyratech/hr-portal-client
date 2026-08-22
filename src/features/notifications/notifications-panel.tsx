'use client';

import { useRouter } from 'next/navigation';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { pathForNotification } from '@/features/notifications/notification-path';
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotificationsOpen } from '@/store/slices/ui-slice';

export function NotificationsPanel() {
  const open = useAppSelector((state) => state.ui.notificationsOpen);
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isLoading } = useGetNotificationsQuery(
    { unread: true },
    {
      skip: !open,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: true,
    },
  );
  useGetNotificationUnreadCountQuery(undefined, {
    skip: !open,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: true,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const items = data?.data ?? [];

  if (!open) {
    return null;
  }

  return (
    <div className="absolute right-4 top-14 z-40 w-[min(100vw-2rem,22rem)] overflow-hidden rounded border border-border bg-background shadow-card md:right-8">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <Meta>Notifications</Meta>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={markingAll || items.length === 0}
            onClick={() => void markAll()}
          >
            {markingAll ? 'Marking' : 'Mark all read'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => dispatch(setNotificationsOpen(false))}>
            Close
          </Button>
        </div>
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <li className="px-4 py-10 text-center text-sm text-muted">Loading…</li>
        ) : items.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">No unread notifications.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                className="w-full px-4 py-3.5 text-left transition-colors hover:bg-surface"
                onClick={() => {
                  if (item.unread) void markRead(item.id);
                  dispatch(setNotificationsOpen(false));
                  router.push(pathForNotification(item, roles));
                }}
              >
                <p className={`text-sm ${item.unread ? 'font-medium text-foreground' : 'text-muted'}`}>{item.title}</p>
                <p className="mt-1 text-sm text-foreground">{item.message}</p>
                <Meta className="mt-2">{new Date(item.createdAt).toLocaleString()}</Meta>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
