/**
 * Shared Supabase client for the v1_kvs_rebabel schema.
 * Use this for all KVS/EAV RPC calls. Replaces per-file createClient() boilerplate.
 *
 * Usage:
 *   import { supabaseKvs } from '@/lib/supabaseKvs';
 *   const { data, error } = await supabaseKvs.rpc('some_function', { ... });
 *
 * Note: supabaseAdmin (from @/lib/supabaseAdmin) targets the production_academic_track
 * schema for legacy v1 direct table queries. Use supabaseKvs for all RPC calls.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseKvs = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: 'v1_kvs_rebabel' },
});
