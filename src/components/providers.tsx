'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastHost } from '@/components/ui/toast-host';
import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { PwaInstallHint } from '@/features/auth/pwa-install-hint';
import { WebPushBootstrap } from '@/features/notifications/web-push-bootstrap';
import { PushPermissionPrompt } from '@/features/notifications/push-permission-prompt';
import { store } from '@/store/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SessionBootstrap />
        <WebPushBootstrap />
        <PwaInstallHint />
        <PushPermissionPrompt />
        {children}
        <ToastHost />
      </ThemeProvider>
    </Provider>
  );
}
