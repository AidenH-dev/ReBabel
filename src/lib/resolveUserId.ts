import { supabaseKvs } from '@/lib/supabaseKvs';
import { log } from '@/lib/logger';

/**
 * Resolves an Auth0 user ID to a ReBabel-owned user ID (usr_<uuid>).
 * Auto-provisions a new USER-IDENTITY entity if one doesn't exist.
 * Called on every authenticated request before passing user ID to RPC functions.
 */
export async function resolveUserId(auth0Sub: string, email?: string | null): Promise<string> {
  const { data, error } = await supabaseKvs
    .rpc('resolve_user_identity', {
      p_auth_provider_id: auth0Sub,
      p_auth_provider: 'auth0',
      p_email: email || null,
    });

  if (error) {
    log.error('user.resolve_failed', { auth0Sub, error: error?.message || String(error) });
    throw new Error('Failed to resolve user identity');
  }

  if (data?.error) {
    log.error('user.resolve_rpc_error', { auth0Sub, error: data.error });
    throw new Error(data.error);
  }

  return data.user_id;
}
