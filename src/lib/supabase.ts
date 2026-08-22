import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv, isSupabaseBrowserConfigured } from '@/lib/env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseBrowserConfigured()) {
    throw new Error('Supabase browser client is not configured.');
  }

  if (!browserClient) {
    browserClient = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
