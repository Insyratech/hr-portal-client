/** Detect iPhone / iPad Safari (not in-app browsers like Chrome iOS). */
export function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const ua = window.navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) {
    return false;
  }
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Android Chrome (primary PWA install path on Android). */
export function isAndroidChrome(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const ua = window.navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser|UCBrowser/i.test(ua);
}

/** True when opened from home screen (Add to Home Screen / Install app). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) {
    return true;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}

export type PwaInstallPlatform = 'ios' | 'android';

export function getPwaInstallPlatform(): PwaInstallPlatform | null {
  if (isStandaloneDisplayMode()) {
    return null;
  }
  if (isIosSafari()) {
    return 'ios';
  }
  if (isAndroidChrome()) {
    return 'android';
  }
  return null;
}

export function shouldShowPwaInstallHint(): boolean {
  return getPwaInstallPlatform() !== null;
}

export const PWA_INSTALL_HINT_DISMISS_KEY = 'hrportal-pwa-install-hint-dismissed';
