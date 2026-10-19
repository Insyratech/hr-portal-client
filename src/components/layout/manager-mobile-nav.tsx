'use client';

import { NavHamburgerMenu } from '@/components/layout/nav-hamburger-menu';
import {
  shellMobileNavSections,
  shellMobileNavTitle,
  shellNavItemActive,
} from '@/components/layout/shell-nav-items';
import type { ShellVariant } from '@/features/auth/role-access';
import { useMyProjectNavItems } from '@/features/work/my-projects';
import { useAppSelector } from '@/store/hooks';

/** Portal navigation hamburger for phone and tablet — desktop uses the left sidebar. */
export function ManagerMobileNav({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  const projectItems = useMyProjectNavItems();
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const sections = shellMobileNavSections(variant, projectItems, roles);

  return (
    <div className="lg:hidden">
      <NavHamburgerMenu
        ariaLabel="Open navigation menu"
        panelTitle={shellMobileNavTitle(variant)}
        sections={sections}
        isItemActive={shellNavItemActive}
      />
    </div>
  );
}
