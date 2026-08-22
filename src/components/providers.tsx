'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ToastHost } from '@/components/ui/toast-host';
import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { store } from '@/store/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
      <ToastHost />
    </Provider>
  );
}
