/** Detect iPhone / iPad Safari (not in-app browsers like Chrome iOS for install hint). */
export function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) {
    return false;
  }
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isSafari;
}

/** True when opened from iOS home screen (Add to Home Screen). */
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

export function shouldShowIosInstallHint(isNativeShell: boolean): boolean {
  return isIosSafari() && !isStandaloneDisplayMode() && !isNativeShell;
}
