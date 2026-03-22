// Implements SPEC-LLM-006 (Set Item Reordering — user-facing API route)
// pages/api/database/v2/sets/reorder-items.ts
import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ReorderItemsRequest {
  setId: string;
  itemIds: string[];
}

interface ReorderItemsResponse {
  success: boolean;
  error?: string;
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body: ReorderItemsRequest = req.body;

    const validation = validateRequest(body);
    if (!validation.isValid) {
      req.log.warn('validation.failed', { error: validation.error });
      return res.status(400).json({ success: false, error: validation.error });
    }

    const { setId, itemIds } = body;
    const userId = req.userId;

    // Ownership check — admins can reorder any set
    if (!req.isAdmin) {
      const { data: setData, error: setError } = await supabaseKvs
        .rpc('get_set_with_items_v2', { set_entity_id: setId });

      if (setError || !setData) {
        return res.status(404).json({ success: false, error: 'Set not found' });
      }

      if ((setData as any).set?.owner !== userId) {
        return res.status(403).json({ success: false, error: 'Forbidden - you do not own this set' });
      }
    }

    const { data, error } = await supabaseKvs
      .rpc('reorder_set_items', { set_id: setId, item_ids: itemIds });

    if (error) {
      req.log.error('rpc.failed', { fn: 'reorder_set_items', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: `Database error: ${error.message}` });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    req.log.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
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
