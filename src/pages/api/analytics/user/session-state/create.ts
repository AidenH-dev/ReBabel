import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  entityId?: string;
  totalChunks?: number;
  isChunked?: boolean;
  existing?: boolean;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionType, sourceSetId, items, config, chunkSize } = req.body || {};

    if (!sessionType || typeof sessionType !== 'string') {
      return res.status(400).json({ success: false, error: 'sessionType is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required and must not be empty' });
    }
    if (items.length > 50000) {
      return res.status(400).json({ success: false, error: 'items array exceeds maximum size of 50,000' });
    }

    for (const item of items) {
      if (!item.itemId || typeof item.itemId !== 'string') {
        return res.status(400).json({ success: false, error: 'Each item must have a non-empty itemId' });
      }
    }

    const rpcItems = items.map((item: any, i: number) => ({
      item_id: item.itemId,
      order: String(i),
    }));

    const { data, error } = await supabaseKvs.rpc('create_session_state', {
      p_owner: req.userId,
      p_session_type: sessionType,
      p_source_set_id: sourceSetId || null,
      p_items: rpcItems,
      p_config: config || null,
      ...(chunkSize && Number.isInteger(chunkSize) && chunkSize > 0 ? { p_chunk_size: chunkSize } : {}),
    });

    if (error) {
      req.log.error('rpc.failed', { fn: 'create_session_state', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to create session state' });
    }

    if (!data.success) {
      const status = data.error === 'owner_required' || data.error === 'session_type_required' || data.error === 'items_required' ? 400 : 500;
      return res.status(status).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      entityId: data.entity_id,
      totalChunks: data.total_chunks,
      isChunked: data.is_chunked,
      existing: data.existing,
    });
  } catch (error: any) {
    req.log.error('session_state.create_failed', { error: error?.message || String(error) });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
