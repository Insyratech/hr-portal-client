'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { NavSectionTitle } from '@/components/layout/nav-section-title';
import { Icon } from '@/components/ui/icon';
import type { NavMenuSection } from '@/components/layout/shell-nav-items';
import type { NavItem } from '@/constants/nav';
import { cn } from '@/lib/utils';
import type { AccentTone } from '@/lib/ui-accents';

type NavHamburgerMenuProps = {
  ariaLabel: string;
  panelTitle: string;
  isItemActive?: (pathname: string, href: string) => boolean;
} & (
  | { items: readonly NavItem[]; sections?: never }
  | { sections: readonly NavMenuSection[]; items?: never }
);

function sectionTone(title: string): AccentTone {
  if (title === 'My project') return 'purple';
  if (title === 'Employee Features') return 'orange';
  return 'gold';
}

function NavItemLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      role="menuitem"
      className={cn(
        'mx-1 flex items-center gap-2.5 rounded px-2.5 py-2.5 text-sm transition-colors',
        active ? 'bg-foreground text-background' : 'text-foreground hover:bg-surface',
      )}
      onClick={onNavigate}
    >
      <Icon name={item.icon} className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span>{item.label}</span>
    </Link>
  );
}

function CollapsibleSection({
  section,
  itemActive,
  onNavigate,
}: {
  section: NavMenuSection;
  itemActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const panelId = useId();
  const tone = sectionTone(section.title);
  const containsActive = section.groups.some((group) => group.items.some((item) => itemActive(item.href)));
  const [open, setOpen] = useState(containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, pathname]);

  return (
    <section aria-label={section.title}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <NavSectionTitle className="px-0 pb-0" tone={tone}>
          {section.title}
        </NavSectionTitle>
        <Icon
          name="chevron-down"
          className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
        />
      </button>
      <div id={panelId} hidden={!open} className={cn(!open && 'hidden')}>
        {section.groups.map((group) => {
          if (group.items.length === 0) return null;
          if (!group.label) {
            return (
              <ul key={`${section.title}-items`} className="space-y-0.5 pb-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavItemLink item={item} active={itemActive(item.href)} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <CollapsibleGroup
              key={group.label}
              label={group.label}
              items={group.items}
              itemActive={itemActive}
              onNavigate={onNavigate}
              metaTone={tone}
            />
          );
        })}
      </div>
    </section>
  );
}

function CollapsibleGroup({
  label,
  items,
  itemActive,
  onNavigate,
  metaTone = 'gold',
}: {
  label: string;
  items: readonly NavItem[];
  itemActive: (href: string) => boolean;
  onNavigate: () => void;
  metaTone?: AccentTone;
}) {
  const pathname = usePathname();
  const panelId = useId();
  const containsActive = items.some((item) => itemActive(item.href));
  const [open, setOpen] = useState(containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, pathname]);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Meta tone={metaTone}>{label}</Meta>
        <Icon
          name="chevron-down"
          className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')}
        />
      </button>
      <ul id={panelId} hidden={!open} className={cn(!open && 'hidden')}>
        {items.map((item) => (
          <li key={item.href}>
            <NavItemLink item={item} active={itemActive(item.href)} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NavHamburgerMenu({
  ariaLabel,
  panelTitle,
  items,
  sections,
  isItemActive,
}: NavHamburgerMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function itemActive(href: string): boolean {
    return isItemActive ? isItemActive(pathname, href) : pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const hasContent = sections
    ? sections.some((section) => section.groups.some((group) => group.items.length > 0))
    : (items?.length ?? 0) > 0;
  if (!hasContent) return null;

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-foreground text-background shadow-card transition-opacity hover:opacity-90',
          open && 'opacity-90',
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="menu" className="h-4 w-4" />
      </button>
      <div
        id={menuId}
        role="menu"
        aria-hidden={!open}
        className={cn(
          'nav-hamburger-panel absolute left-0 top-[calc(100%+0.4rem)] z-[60] w-[min(19rem,calc(100vw-2rem))] origin-top-left rounded border border-border bg-background shadow-card',
          open ? 'nav-hamburger-panel-open' : 'nav-hamburger-panel-closed pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
          <Meta className="font-medium">{panelTitle}</Meta>
          <button
            type="button"
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            onClick={closeMenu}
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[min(28rem,65vh)] overflow-y-auto py-2">
          {sections
            ? sections.map((section, sectionIndex) => (
                <div
                  key={section.title}
                  className={cn(sectionIndex > 0 && 'mt-1 border-t border-border pt-1')}
                >
                  <CollapsibleSection section={section} itemActive={itemActive} onNavigate={closeMenu} />
                </div>
              ))
            : (
              <ul className="space-y-0.5">
                {items?.map((item) => (
                  <li key={item.href}>
                    <NavItemLink item={item} active={itemActive(item.href)} onNavigate={closeMenu} />
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}
