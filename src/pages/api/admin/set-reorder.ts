// Admin-gated API for bulk set item reordering (CSV upload flow)
// GET  /api/admin/set-reorder?setId=xxx  — load set + items for display
// POST /api/admin/set-reorder             — apply new item order
// pages/api/admin/set-reorder.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { withLogger } from '@/lib/withLogger';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withApiAuthRequired(withLogger(async function handler(
  req,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const isAdmin = (session.user as any)['https://rebabel.org/app_metadata']?.isAdmin || false;
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Forbidden - admin access required' });
  }

  // GET — load set data for display
  if (req.method === 'GET') {
    const { setId } = req.query;
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({ success: false, error: 'setId query param required' });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
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

    const { error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('reorder_set_items', { set_id: setId, item_ids: itemIds });

    if (error) {
      req.log.error('rpc.failed', { fn: 'reorder_set_items', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: `Database error: ${error.message}` });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}));
