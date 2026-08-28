import type { ReactNode } from 'react';
import { EmployeeWorkMobileNav } from '@/components/layout/employee-work-mobile-nav';
import { EmployeeWorkSidebar } from '@/components/layout/employee-work-sidebar';

export default function EmployeeWorkLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <EmployeeWorkMobileNav />
      <div className="flex gap-6 lg:gap-10">
        <EmployeeWorkSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
