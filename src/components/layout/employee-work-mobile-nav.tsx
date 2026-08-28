'use client';

import { useWorkSidebarItems } from '@/components/layout/employee-work-sidebar';
import { NavHamburgerMenu } from '@/components/layout/nav-hamburger-menu';
import { isWorkSubnavActive } from '@/constants/nav';

/** Work section hamburger for phone and tablet — desktop uses the left sidebar. */
export function EmployeeWorkMobileNav() {
  const items = useWorkSidebarItems();

  return (
    <div className="mb-6 lg:hidden">
      <NavHamburgerMenu
        ariaLabel="Open work sections"
        panelTitle="Work"
        items={items}
        isItemActive={(currentPath, href) => isWorkSubnavActive(currentPath, href)}
      />
    </div>
  );
}
