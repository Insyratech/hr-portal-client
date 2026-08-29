import { clientEnv } from '@/lib/env';

export function getSupabaseProjectRef(): string {
  try {
    const hostname = new URL(clientEnv.supabaseUrl).hostname;
    return hostname.split('.')[0] ?? 'supabase';
  } catch {
    return 'supabase';
  }
}

export function getSupabaseAuthStorageKey(): string {
  return `sb-${getSupabaseProjectRef()}-auth-token`;
}

export type SupabaseSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: { id: string };
};

export function buildSupabaseSessionStorageValue(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  userId: string;
}): string {
  const expiresIn = input.expiresIn ?? 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const payload: SupabaseSessionPayload = {
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: { id: input.userId },
  };
  return JSON.stringify(payload);
}

export const NATIVE_SESSION_INJECTED_EVENT = 'hrportal-session-injected';

export function dispatchNativeSessionInjected(): void {
  window.dispatchEvent(new Event(NATIVE_SESSION_INJECTED_EVENT));
}
