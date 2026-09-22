import type { ReactNode } from 'react';

/** Public kiosk layout — no RouteGuard / no ERP shell. */
export default function ScanLayout({ children }: { children: ReactNode }) {
  return children;
}
