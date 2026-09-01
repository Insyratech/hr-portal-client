export function parseAuthHashError(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  if (!params.get('error')) return null;
  const description = params.get('error_description')?.replace(/\+/g, ' ');
  if (description) return description;
  const code = params.get('error_code');
  if (code === 'otp_expired') return 'This reset link has expired. Request a new one.';
  return 'This reset link is invalid. Request a new one.';
}

export function hasRecoveryTokenInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  if (parseAuthHashError()) return false;
  return hash.includes('type=recovery') || hash.includes('access_token=');
}
