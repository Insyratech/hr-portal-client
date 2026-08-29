const PASSWORD_AUTH_KEY = 'hrportal-last-password-auth-at';
const PASSWORD_REAUTH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readTimestamp(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(PASSWORD_AUTH_KEY);
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function recordPasswordAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(PASSWORD_AUTH_KEY, String(Date.now()));
}

export function clearPasswordAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(PASSWORD_AUTH_KEY);
}

/** Existing sessions without a stamp are grandfathered once, then tracked for 7-day re-auth. */
export function touchPasswordAuthIfMissing(): void {
  if (readTimestamp() == null) {
    recordPasswordAuth();
  }
}

export function shouldRequirePasswordReauth(): boolean {
  const lastAuth = readTimestamp();
  if (lastAuth == null) {
    return false;
  }
  return Date.now() - lastAuth > PASSWORD_REAUTH_MAX_AGE_MS;
}
