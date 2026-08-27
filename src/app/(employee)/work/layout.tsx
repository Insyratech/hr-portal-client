import type { ReactNode } from 'react';
import { EmployeeWorkSidebar } from '@/components/layout/employee-work-sidebar';

export default function EmployeeWorkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-6 lg:gap-10">
      <EmployeeWorkSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
