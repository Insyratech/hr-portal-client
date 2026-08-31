'use client';

import { usePathname } from 'next/navigation';
import { useWorkNavGroups } from '@/components/layout/employee-work-sidebar';
import { NavHamburgerMenu } from '@/components/layout/nav-hamburger-menu';
import { isMyProjectArea, isWorkSubnavActive } from '@/constants/nav';

/** Work hamburger for phone and tablet — personal My work only. */
export function EmployeeWorkMobileNav() {
  const pathname = usePathname();
  const { workItems } = useWorkNavGroups();

  if (isMyProjectArea(pathname) || workItems.length === 0) return null;

  return (
    <div className="mb-6 lg:hidden">
      <NavHamburgerMenu
        ariaLabel="Open My work"
        panelTitle="My work"
        items={workItems}
        isItemActive={(currentPath, href) => isWorkSubnavActive(currentPath, href)}
      />
    </div>
  );
}
