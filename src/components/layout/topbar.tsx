'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EMPLOYEE_NAV, isNavActive } from '@/constants/nav';
import { Meta } from '@/components/layout/meta';
import { Icon } from '@/components/ui/icon';
import { NotificationsPanel } from '@/features/notifications/notifications-panel';
import { useGetNotificationUnreadCountQuery } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openConfirmDialog, setCommandPaletteOpen, toggleNotificationsOpen } from '@/store/slices/ui-slice';
import { cn } from '@/lib/utils';

export function Topbar({ variant }: { variant: 'employee' | 'admin' | 'super-admin' }) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const displayName = user?.name ?? 'Guest';
  const { data: unread } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !user,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const unreadCount = unread?.data.count ?? 0;

  return (
    <header className="relative sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="flex h-14 items-center justify-between gap-6 px-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          {variant === 'employee' ? (
            <>
              <Meta>HR Portal</Meta>
              <nav className="hidden items-center gap-1 md:flex">
                {EMPLOYEE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors',
                      isNavActive(pathname, item.href)
                        ? 'bg-surface text-foreground'
                        : 'text-muted hover:bg-surface hover:text-foreground',
                    )}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </>
          ) : (
            <button
              type="button"
              aria-label="Search"
              className="flex h-10 w-full max-w-sm items-center gap-3 rounded border border-border bg-surface px-3 text-left text-sm text-muted shadow-card transition-colors hover:border-foreground/30"
              onClick={() => dispatch(setCommandPaletteOpen(true))}
            >
              <Icon name="search" className="h-4 w-4 text-muted" />
              <span className="flex-1">Search</span>
              <span className="hidden text-xs tracking-[0.12em] text-muted sm:inline">⌘ K</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative inline-flex h-10 items-center gap-2 rounded border border-transparent px-3 text-sm text-foreground transition-colors hover:border-border hover:bg-surface"
            aria-label="Notifications"
            onClick={() => dispatch(toggleNotificationsOpen())}
          >
            <Icon name="bell" className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
            {unreadCount > 0 ? (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded bg-foreground px-1.5 text-xs text-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
          {variant === 'employee' ? (
            <Link
              href="/more/password"
              className="hidden h-10 items-center rounded px-3 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground sm:inline-flex"
            >
              Password
            </Link>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded border border-border bg-background px-3 text-sm text-foreground shadow-card transition-colors hover:bg-surface"
            onClick={() =>
              dispatch(
                openConfirmDialog({
                  title: 'Sign out',
                  description: 'You will need to sign in again to use the portal.',
                  action: 'logout',
                }),
              )
            }
          >
            <Icon name="user" className="h-4 w-4 text-muted" />
            <span className="max-w-[10rem] truncate">{displayName}</span>
          </button>
        </div>
      </div>
      <NotificationsPanel />
    </header>
  );
}
