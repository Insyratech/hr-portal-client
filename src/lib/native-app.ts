export type NativePlatform = 'android' | 'ios';

export type NativeLoginPayload = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

type HRPortalNativeBridge = {
  isNativeApp: () => boolean;
  onLoginSuccess: (payload: NativeLoginPayload) => void;
  onLogout: () => void;
  getPlatform: () => NativePlatform;
};

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
  HRPortalNative?: HRPortalNativeBridge;
};

function getWindow(): CapacitorWindow | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window as CapacitorWindow;
}

export function isCapacitorShell(): boolean {
  const win = getWindow();
  if (!win) {
    return false;
  }
  return win.Capacitor?.isNativePlatform?.() === true;
}

export function isNativeApp(): boolean {
  const win = getWindow();
  if (!win) {
    return false;
  }
  if (win.HRPortalNative?.isNativeApp()) {
    return true;
  }
  return isCapacitorShell();
}

export function isNativeBridgeReady(): boolean {
  const win = getWindow();
  return Boolean(win?.HRPortalNative);
}

export function getNativePlatform(): NativePlatform | null {
  const win = getWindow();
  if (!win?.HRPortalNative) {
    return null;
  }
  return win.HRPortalNative.getPlatform();
}

export function notifyNativeLoginSuccess(payload: NativeLoginPayload): void {
  const bridge = getWindow()?.HRPortalNative;
  if (!bridge) {
    return;
  }
  bridge.onLoginSuccess(payload);
}

export function notifyNativeLogout(): void {
  const bridge = getWindow()?.HRPortalNative;
  if (!bridge) {
    return;
  }
  bridge.onLogout();
}

export const NATIVE_BRIDGE_READY_EVENT = 'hrportal-native-ready';
