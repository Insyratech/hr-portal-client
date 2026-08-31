'use client';

import { useWorkNavGroups } from '@/components/layout/employee-work-sidebar';
import { NavHamburgerMenu } from '@/components/layout/nav-hamburger-menu';
import type { NavMenuSection } from '@/components/layout/shell-nav-items';
import { isWorkSubnavActive } from '@/constants/nav';

/** Work section hamburger for phone and tablet — desktop uses the left sidebar. */
export function EmployeeWorkMobileNav() {
  const { workItems, projectItems } = useWorkNavGroups();

  const sections: NavMenuSection[] = [{ title: 'My work', groups: [{ items: workItems }] }];
  if (projectItems.length > 0) {
    sections.push({ title: 'My project', groups: [{ items: projectItems }] });
  }

  return (
    <div className="mb-6 lg:hidden">
      <NavHamburgerMenu
        ariaLabel="Open work sections"
        panelTitle="Work"
        sections={sections}
        isItemActive={(currentPath, href) => isWorkSubnavActive(currentPath, href)}
      />
    </div>
  );
}
