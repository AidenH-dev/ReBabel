import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Resolves an Auth0 user ID to a ReBabel-owned user ID (usr_<uuid>).
 * Auto-provisions a new USER-IDENTITY entity if one doesn't exist.
 * Called on every authenticated request before passing user ID to RPC functions.
 */
export async function resolveUserId(auth0Sub: string, email?: string | null): Promise<string> {
  const { data, error } = await supabaseAdmin
    .schema('v1_kvs_rebabel')
    .rpc('resolve_user_identity', {
      p_auth_provider_id: auth0Sub,
      p_auth_provider: 'auth0',
      p_email: email || null,
    });

  if (error) {
    console.error('Failed to resolve user identity:', error);
    throw new Error('Failed to resolve user identity');
  }

  if (data?.error) {
    console.error('resolve_user_identity returned error:', data.error);
    throw new Error(data.error);
  }

  return data.user_id;
}
