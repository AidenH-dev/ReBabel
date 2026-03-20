// Implements SPEC-LLM-006 (Set Item Reordering — user-facing API route)
// pages/api/database/v2/sets/reorder-items.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { resolveUserId } from '@/lib/resolveUserId';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReorderItemsRequest {
  setId: string;
  itemIds: string[];
}

interface ReorderItemsResponse {
  success: boolean;
  error?: string;
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReorderItemsResponse>
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized - authentication required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body: ReorderItemsRequest = req.body;

    const validation = validateRequest(body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const { setId, itemIds } = body;
    const userId = await resolveUserId(session.user.sub);
    const isAdmin = (session.user as any)['https://rebabel.org/app_metadata']?.isAdmin || false;

    // Ownership check — admins can reorder any set
    if (!isAdmin) {
      const { data: setData, error: setError } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('get_set_with_items_v2', { set_entity_id: setId });

      if (setError || !setData) {
        return res.status(404).json({ success: false, error: 'Set not found' });
      }

      if ((setData as any).set?.owner !== userId) {
        return res.status(403).json({ success: false, error: 'Forbidden - you do not own this set' });
      }
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('reorder_set_items', { set_id: setId, item_ids: itemIds });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ success: false, error: `Database error: ${error.message}` });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body.setId || typeof body.setId !== 'string') {
    return { isValid: false, error: 'setId must be a non-empty string' };
  }
  if (!Array.isArray(body.itemIds) || body.itemIds.length < 2) {
    return { isValid: false, error: 'itemIds must be an array with at least 2 items' };
  }
  if (body.itemIds.some((id: any) => typeof id !== 'string' || !id)) {
    return { isValid: false, error: 'All itemIds must be non-empty strings' };
  }
  return { isValid: true };
}
