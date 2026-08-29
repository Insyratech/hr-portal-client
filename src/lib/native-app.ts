export type NativePlatform = 'android' | 'ios';

export type NativeLoginPayload = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

export type BiometricEnrollStatus = 'enabled' | 'cancelled' | 'unavailable';
export type BiometricUnlockStatus = 'success' | 'cancelled' | 'expired';

type HRPortalNativeBridge = {
  isNativeApp: () => boolean;
  onLoginSuccess: (payload: NativeLoginPayload) => void;
  onLogout: () => void;
  getPlatform: () => NativePlatform;
  isBiometricHardwareAvailable?: () => boolean;
  isBiometricEnrolled?: () => boolean;
  enrollBiometric?: () => Promise<BiometricEnrollStatus>;
  unlockWithBiometric?: () => Promise<BiometricUnlockStatus>;
  injectSession?: (payload: { accessToken: string; refreshToken: string; userId?: string }) => void;
};

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      HRPortalBridge?: {
        enrollBiometric: (input?: { payload?: { deviceId?: string } }) => Promise<{ status: BiometricEnrollStatus }>;
        unlockWithBiometric: () => Promise<{ status: BiometricUnlockStatus }>;
        isBiometricHardwareAvailable: () => Promise<{ available: boolean }>;
        isBiometricEnrolled: () => Promise<{ enrolled: boolean }>;
        notifyLoginSuccess: (input: { payload: NativeLoginPayload }) => Promise<void>;
        notifyLogout: () => Promise<void>;
        revokeBiometricEnroll: (input: { deviceId: string }) => Promise<void>;
        recordCredentialAuth: (input: { deviceId: string }) => Promise<void>;
      };
    };
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

export function waitForNativeBridge(timeoutMs = 5000): Promise<boolean> {
  if (isNativeBridgeReady()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const started = Date.now();

    function finish(result: boolean): void {
      window.removeEventListener(NATIVE_BRIDGE_READY_EVENT, onReady);
      clearInterval(timer);
      resolve(result);
    }

    function onReady(): void {
      finish(true);
    }

    const timer = window.setInterval(() => {
      if (isNativeBridgeReady()) {
        finish(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        finish(false);
      }
    }, 100);

    window.addEventListener(NATIVE_BRIDGE_READY_EVENT, onReady);
  });
}

export function notifyNativeLoginSuccess(payload: NativeLoginPayload): void {
  const bridge = getWindow()?.HRPortalNative;
  if (!bridge) {
    return;
  }
  bridge.onLoginSuccess(payload);
}

export async function notifyNativeLoginSuccessWhenReady(payload: NativeLoginPayload): Promise<void> {
  await waitForNativeBridge();
  notifyNativeLoginSuccess(payload);
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    await plugin.notifyLoginSuccess({ payload });
    await plugin.recordCredentialAuth({ deviceId: getOrCreateDeviceId() });
  }
}

export async function notifyNativeLogout(): Promise<void> {
  const bridge = getWindow()?.HRPortalNative;
  if (bridge) {
    bridge.onLogout();
  }
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    await plugin.revokeBiometricEnroll({ deviceId: getOrCreateDeviceId() });
    await plugin.notifyLogout();
  }
}

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  await waitForNativeBridge();
  const bridge = getWindow()?.HRPortalNative;
  if (bridge?.isBiometricHardwareAvailable) {
    return bridge.isBiometricHardwareAvailable();
  }
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    const result = await plugin.isBiometricHardwareAvailable();
    return result.available;
  }
  return false;
}

export async function isBiometricEnrolled(): Promise<boolean> {
  await waitForNativeBridge();
  const bridge = getWindow()?.HRPortalNative;
  if (bridge?.isBiometricEnrolled) {
    return bridge.isBiometricEnrolled();
  }
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    const result = await plugin.isBiometricEnrolled();
    return result.enrolled;
  }
  return false;
}

export async function enrollNativeBiometric(): Promise<BiometricEnrollStatus> {
  await waitForNativeBridge();
  const bridge = getWindow()?.HRPortalNative;
  if (bridge?.enrollBiometric) {
    return bridge.enrollBiometric();
  }
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    const result = await plugin.enrollBiometric({ payload: { deviceId: getOrCreateDeviceId() } });
    return result.status;
  }
  return 'unavailable';
}

export async function unlockNativeBiometric(): Promise<BiometricUnlockStatus> {
  await waitForNativeBridge();
  const bridge = getWindow()?.HRPortalNative;
  if (bridge?.unlockWithBiometric) {
    return bridge.unlockWithBiometric();
  }
  const plugin = getWindow()?.Capacitor?.Plugins?.HRPortalBridge;
  if (plugin) {
    const result = await plugin.unlockWithBiometric();
    return result.status;
  }
  return 'cancelled';
}

export function getOrCreateDeviceId(): string {
  const key = 'hrportal-device-id';
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export const NATIVE_BRIDGE_READY_EVENT = 'hrportal-native-ready';
export const NATIVE_PUSH_NAVIGATE_EVENT = 'hrportal-push-navigate';
export const NATIVE_CREDENTIAL_EXPIRED_EVENT = 'hrportal-credential-expired';

export function dispatchNativePushNavigate(path: string): void {
  window.dispatchEvent(new CustomEvent(NATIVE_PUSH_NAVIGATE_EVENT, { detail: { path } }));
}

export function dispatchCredentialExpired(): void {
  window.dispatchEvent(new Event(NATIVE_CREDENTIAL_EXPIRED_EVENT));
}
