'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastHost } from '@/components/ui/toast-host';
import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { NativeAppBanner } from '@/features/auth/native-app-banner';
import { store } from '@/store/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SessionBootstrap />
        <NativeAppBanner />
        {children}
        <ToastHost />
      </ThemeProvider>
    </Provider>
  );
}
