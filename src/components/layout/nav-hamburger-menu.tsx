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

type NavHamburgerMenuProps = {
  ariaLabel: string;
  panelTitle: string;
  isItemActive?: (pathname: string, href: string) => boolean;
} & (
  | { items: readonly NavItem[]; sections?: never }
  | { sections: readonly NavMenuSection[]; items?: never }
);

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

  const hasContent = sections ? sections.some((section) => section.groups.some((group) => group.items.length > 0)) : (items?.length ?? 0) > 0;
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
                <section
                  key={section.title}
                  className={cn(sectionIndex > 0 && 'mt-2 border-t border-border pt-2')}
                  aria-label={section.title}
                >
                  <NavSectionTitle className="pb-1">{section.title}</NavSectionTitle>
                  {section.groups.map((group) => {
                    if (group.items.length === 0) return null;
                    return (
                      <div key={group.label ?? section.title} className="space-y-0.5">
                        {group.label ? <Meta className="px-3 pt-2">{group.label}</Meta> : null}
                        <ul>
                          {group.items.map((item) => (
                            <li key={item.href}>
                              <NavItemLink item={item} active={itemActive(item.href)} onNavigate={closeMenu} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </section>
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
