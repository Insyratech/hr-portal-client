'use client';

import { NavHamburgerMenu } from '@/components/layout/nav-hamburger-menu';
import {
  shellMobileNavSections,
  shellMobileNavTitle,
  shellNavItemActive,
} from '@/components/layout/shell-nav-items';
import type { ShellVariant } from '@/features/auth/role-access';
import { useIsProjectLead } from '@/features/work/project-lead';

/** Portal navigation hamburger for phone and tablet — desktop uses the left sidebar. */
export function ManagerMobileNav({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  const { isProjectLead } = useIsProjectLead();
  const sections = shellMobileNavSections(variant, isProjectLead);

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
