export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
};

export function isSupabaseBrowserConfigured(): boolean {
  return clientEnv.supabaseUrl.length > 0 && clientEnv.supabaseAnonKey.length > 0;
}

export function isVapidConfigured(): boolean {
  return clientEnv.vapidPublicKey.length > 0;
}
