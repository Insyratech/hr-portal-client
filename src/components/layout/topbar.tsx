'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { EMPLOYEE_NAV, EMPLOYEE_WORK_SUBNAV, isNavActive, isWorkSubnavActive } from '@/constants/nav';
import { Meta } from '@/components/layout/meta';
import { Icon } from '@/components/ui/icon';
import { NotificationsPanel } from '@/features/notifications/notifications-panel';
import { useGetNotificationUnreadCountQuery } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openConfirmDialog, setCommandPaletteOpen, toggleNotificationsOpen } from '@/store/slices/ui-slice';
import { cn } from '@/lib/utils';
import { primaryRoleCode, type ShellVariant } from '@/features/auth/role-access';
import { roleLabel } from '@/features/employees/onboarding-roles';

function EmployeeWorkMenu() {
  const pathname = usePathname();
  const workActive = isNavActive(pathname, '/work');
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      clearCloseTimer();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        href="/work"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          'inline-flex shrink-0 items-center gap-2 rounded px-2.5 py-2 text-sm transition-colors lg:px-3',
          workActive || open
            ? 'bg-surface text-foreground'
            : 'text-muted hover:bg-surface hover:text-foreground',
        )}
        onFocus={openMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="grid" className="h-3.5 w-3.5" />
        Work
        <Icon name="chevron-down" className={cn('h-3 w-3 opacity-70 transition', open && 'rotate-180')} />
      </Link>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-[calc(100%+0.35rem)] z-[60] w-52 rounded border border-border bg-background py-1 shadow-card"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {EMPLOYEE_WORK_SUBNAV.map((item) => {
            const active = isWorkSubnavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-foreground hover:bg-surface',
                )}
                onClick={() => setOpen(false)}
              >
                <Icon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Topbar({ variant }: { variant: ShellVariant }) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const displayName = user?.name ?? 'Guest';
  const displayRole = user?.roles?.length ? roleLabel(primaryRoleCode(user.roles)) : null;
  const { data: unread } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !user,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const unreadCount = unread?.data.count ?? 0;
  const onWorkSection = pathname === '/work' || pathname.startsWith('/work/');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="flex h-14 items-center justify-between gap-6 px-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          {variant === 'employee' ? (
            <>
              <Meta>HR Portal</Meta>
              <nav className="hidden items-center gap-0.5 md:flex lg:gap-1">
                {EMPLOYEE_NAV.map((item) =>
                  item.href === '/work' ? (
                    <EmployeeWorkMenu key={item.href} />
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-2 rounded px-2.5 py-2 text-sm transition-colors lg:px-3',
                        isNavActive(pathname, item.href)
                          ? 'bg-surface text-foreground'
                          : 'text-muted hover:bg-surface hover:text-foreground',
                      )}
                    >
                      <Icon name={item.icon} className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  ),
                )}
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
            className="inline-flex min-h-10 items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-card transition-colors hover:bg-surface"
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
            <Icon name="user" className="h-4 w-4 shrink-0 text-muted" />
            <span className="flex min-w-0 flex-col items-start text-left leading-tight">
              <span className="max-w-[12rem] truncate font-medium">{displayName}</span>
              {displayRole ? (
                <span className="max-w-[12rem] truncate text-[11px] text-muted">{displayRole}</span>
              ) : null}
            </span>
          </button>
        </div>
      </div>

      {variant === 'employee' && onWorkSection ? (
        <nav aria-label="Work sections" className="border-t border-border bg-surface">
          <ul className="flex gap-1 overflow-x-auto px-4 py-2 md:px-8">
            {EMPLOYEE_WORK_SUBNAV.map((item) => {
              const active = isWorkSubnavActive(pathname, item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded border px-3 py-2 text-xs uppercase tracking-[0.12em] transition-colors',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted hover:text-foreground',
                    )}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <NotificationsPanel />
    </header>
  );
}
