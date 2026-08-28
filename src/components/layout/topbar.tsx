'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { EMPLOYEE_NAV, EMPLOYEE_WORK_SUBNAV, isNavActive, isWorkSubnavActive } from '@/constants/nav';
import { Meta } from '@/components/layout/meta';
import { ManagerMobileNav } from '@/components/layout/manager-mobile-nav';
import { Icon } from '@/components/ui/icon';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationsPanel } from '@/features/notifications/notifications-panel';
import { useGetLeadProjectsQuery, useGetNotificationUnreadCountQuery } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openConfirmDialog, setCommandPaletteOpen, toggleNotificationsOpen } from '@/store/slices/ui-slice';
import { cn } from '@/lib/utils';
import { primaryRoleCode, type ShellVariant } from '@/features/auth/role-access';
import { roleLabel } from '@/features/employees/onboarding-roles';

function isProjectDeskPath(pathname: string): boolean {
  return pathname === '/work/projects' || pathname.startsWith('/work/projects/');
}

function EmployeeWorkMenu() {
  const pathname = usePathname();
  const workActive =
    (pathname === '/work' || pathname.startsWith('/work/')) && !isProjectDeskPath(pathname);
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

function ProjectDeskNavLink() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useGetLeadProjectsQuery(undefined, { skip: !user });
  const projects = data?.data ?? [];
  if (projects.length === 0) return null;

  const active = isProjectDeskPath(pathname);
  return (
    <Link
      href="/work/projects"
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded px-2.5 py-2 text-sm transition-colors lg:px-3',
        active ? 'bg-surface text-foreground' : 'text-muted hover:bg-surface hover:text-foreground',
      )}
    >
      <Icon name="building" className="h-3.5 w-3.5" />
      Project desk
    </Link>
  );
}

function UserAccountMenu({
  displayName,
  displayRole,
  isSuperAdmin,
}: {
  displayName: string;
  displayRole: string | null;
  isSuperAdmin: boolean;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const profileHref = isSuperAdmin ? '/super-admin/profile' : '/more/profile';
  const profileLabel = isSuperAdmin ? 'Profile' : 'Profile details';

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
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          'inline-flex min-h-10 items-center gap-2 rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground shadow-card transition-colors hover:bg-surface lg:px-3',
          open && 'bg-surface',
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="user" className="h-4 w-4 shrink-0 text-muted" />
        <span className="hidden min-w-0 flex-col items-start text-left leading-tight lg:flex">
          <span className="max-w-[12rem] truncate font-medium">{displayName}</span>
          {displayRole ? (
            <span className="max-w-[12rem] truncate text-[11px] text-muted">{displayRole}</span>
          ) : null}
        </span>
        <Icon name="chevron-down" className={cn('hidden h-3 w-3 shrink-0 opacity-70 transition lg:block', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-[60] w-56 rounded border border-border bg-background py-1 shadow-card"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {displayRole ? <p className="truncate text-xs text-muted">{displayRole}</p> : null}
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <Icon name="pencil" className="h-3.5 w-3.5 text-muted" />
            {profileLabel}
          </Link>
          <Link
            href="/more/password"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <Icon name="settings" className="h-3.5 w-3.5 text-muted" />
            Password
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface"
            onClick={() => {
              setOpen(false);
              dispatch(
                openConfirmDialog({
                  title: 'Sign out',
                  description: 'You will need to sign in again to use the portal.',
                  action: 'logout',
                }),
              );
            }}
          >
            <Icon name="close" className="h-3.5 w-3.5 text-muted" />
            Sign out
          </button>
          <div className="border-t border-border px-3 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
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
  const roles = user?.roles ?? [];
  const displayRole = roles.length ? roleLabel(primaryRoleCode(roles)) : null;
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const { data: unread } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !user,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const unreadCount = unread?.data.count ?? 0;
  const notificationsOpen = useAppSelector((state) => state.ui.notificationsOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          {variant === 'employee' ? (
            <>
              <Meta>HR Portal</Meta>
              <nav className="hidden items-center gap-0.5 lg:flex lg:gap-1">
                {EMPLOYEE_NAV.map((item) =>
                  item.href === '/work' ? (
                    <span key={item.href} className="contents">
                      <EmployeeWorkMenu />
                      <ProjectDeskNavLink />
                    </span>
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
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
              <ManagerMobileNav variant={variant as Exclude<ShellVariant, 'employee'>} />
              <button
                type="button"
                aria-label="Search"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-surface text-muted shadow-card transition-colors hover:border-foreground/30 lg:w-full lg:max-w-sm lg:justify-start lg:gap-3 lg:px-3 lg:text-left lg:text-sm"
                onClick={() => dispatch(setCommandPaletteOpen(true))}
              >
                <Icon name="search" className="h-4 w-4 text-muted" />
                <span className="hidden flex-1 lg:inline">Search</span>
                <span className="hidden text-xs tracking-[0.12em] text-muted lg:inline">⌘ K</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <button
            type="button"
            data-notifications-trigger
            aria-expanded={notificationsOpen}
            className={cn(
              'relative inline-flex h-10 items-center gap-2 rounded border px-3 text-sm transition-colors',
              notificationsOpen
                ? 'border-border bg-surface text-foreground'
                : 'border-transparent text-foreground hover:border-border hover:bg-surface',
            )}
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
          <UserAccountMenu
            displayName={displayName}
            displayRole={displayRole}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>

      <NotificationsPanel />
    </header>
  );
}
