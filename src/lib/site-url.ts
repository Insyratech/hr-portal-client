import { clientEnv } from '@/lib/env';

/** Origin for auth redirects — uses the live browser URL in production (e.g. Vercel). */
export function getClientSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return clientEnv.siteUrl.replace(/\/$/, '');
}

export function clientAuthPath(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${getClientSiteOrigin()}${suffix}`;
}
