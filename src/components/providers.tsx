'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastHost } from '@/components/ui/toast-host';
import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { NativeAppBanner } from '@/features/auth/native-app-banner';
import { NativePushBootstrap } from '@/features/auth/native-push-bootstrap';
import { IosInstallHint } from '@/features/auth/ios-install-hint';
import { NativeSessionBridge } from '@/features/auth/native-session-bridge';
import { NativeBiometricPrompt } from '@/features/auth/native-biometric-prompt';
import { store } from '@/store/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SessionBootstrap />
        <NativeSessionBridge />
        <NativePushBootstrap />
        <IosInstallHint />
        <NativeBiometricPrompt />
        <NativeAppBanner />
        {children}
        <ToastHost />
      </ThemeProvider>
    </Provider>
  );
}
