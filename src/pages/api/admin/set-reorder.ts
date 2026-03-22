// Admin-gated API for bulk set item reordering (CSV upload flow)
// GET  /api/admin/set-reorder?setId=xxx  — load set + items for display
// POST /api/admin/set-reorder             — apply new item order
// pages/api/admin/set-reorder.ts
import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
) {
  // GET — load set data for display
  if (req.method === 'GET') {
    const { setId } = req.query;
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({ success: false, error: 'setId query param required' });
    }

    const { data, error } = await supabaseKvs
      .rpc('get_set_with_items_v2', { set_entity_id: setId });

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Set not found' });
    }

    return res.status(200).json({ success: true, message: data });
  }

  // POST — apply reorder
  if (req.method === 'POST') {
    const { setId, itemIds } = req.body;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({ success: false, error: 'setId must be a non-empty string' });
    }
    if (!Array.isArray(itemIds) || itemIds.length < 2) {
      return res.status(400).json({ success: false, error: 'itemIds must be an array with at least 2 items' });
    }
    if (itemIds.some((id: any) => typeof id !== 'string' || !id)) {
      return res.status(400).json({ success: false, error: 'All itemIds must be non-empty strings' });
    }

    const { error } = await supabaseKvs
      .rpc('reorder_set_items', { set_id: setId, item_ids: itemIds });

    if (error) {
      req.log.error('rpc.failed', { fn: 'reorder_set_items', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: `Database error: ${error.message}` });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}, { requireAdmin: true });
