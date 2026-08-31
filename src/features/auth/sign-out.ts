import { unregisterWebPush } from '@/features/notifications/web-push-bootstrap';
import { isSupabaseBrowserConfigured } from '@/lib/env';
import { clearPasswordAuth } from '@/lib/session-policy';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { AppDispatch } from '@/store/store';
import { clearSession } from '@/store/slices/auth-slice';
import { clearPermissions } from '@/store/slices/permissions-slice';

/** Clears Supabase session, Redux auth, and best-effort web-push registration. */
export async function performSignOut(dispatch: AppDispatch): Promise<void> {
  await unregisterWebPush(dispatch);

  if (isSupabaseBrowserConfigured()) {
    await getSupabaseBrowserClient().auth.signOut();
  }

  clearPasswordAuth();
  dispatch(clearPermissions());
  dispatch(clearSession());
}
