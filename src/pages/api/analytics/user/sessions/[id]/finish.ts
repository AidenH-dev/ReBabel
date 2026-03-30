// Implements SPEC-LLM-001
// POST /api/analytics/user/sessions/[id]/finish
// Body: { itemsReviewed?: number, itemsCorrect?: number, rollingUpdate?: boolean }
import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  session_status?: string;
  end_time?: string;
  items_reviewed?: number | null;
  items_correct?: number | null;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.userId;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  const { itemsReviewed, itemsCorrect, rollingUpdate } = req.body || {};

  // Validate itemsReviewed
  if (itemsReviewed !== undefined && itemsReviewed !== null) {
    if (!Number.isInteger(itemsReviewed) || itemsReviewed < 0) {
      return res.status(400).json({ success: false, error: 'itemsReviewed must be a non-negative integer' });
    }
  }

  // Validate itemsCorrect
  if (itemsCorrect !== undefined && itemsCorrect !== null) {
    if (!Number.isInteger(itemsCorrect) || itemsCorrect < 0) {
      return res.status(400).json({ success: false, error: 'itemsCorrect must be a non-negative integer' });
    }
  }

  // itemsCorrect cannot be present without itemsReviewed
  if ((itemsCorrect !== undefined && itemsCorrect !== null) &&
      (itemsReviewed === undefined || itemsReviewed === null)) {
    return res.status(400).json({ success: false, error: 'itemsCorrect cannot be provided without itemsReviewed' });
  }

  // itemsCorrect must be <= itemsReviewed when both provided
  if (
    itemsCorrect !== undefined && itemsCorrect !== null &&
    itemsReviewed !== undefined && itemsReviewed !== null &&
    itemsCorrect > itemsReviewed
  ) {
    return res.status(400).json({ success: false, error: 'itemsCorrect cannot exceed itemsReviewed' });
  }

  // Validate rollingUpdate
  if (rollingUpdate !== undefined && typeof rollingUpdate !== 'boolean') {
    return res.status(400).json({ success: false, error: 'rollingUpdate must be a boolean' });
  }

  try {
    // First verify the session belongs to this user
    const { data: sessionData } = await supabaseKvs
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (!sessionData || sessionData.owner !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabaseKvs
      .rpc('finish_user_stat_session_v2', {
        p_entity_id: id,
        p_items_reviewed: itemsReviewed ?? null,
        p_items_correct: itemsCorrect ?? null,
        p_rolling_update: rollingUpdate ?? false,
        p_owner: req.userId,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'finish_user_stat_session_v2', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to finish session' });
    }

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.error || 'Failed to finish session' });
    }

    return res.status(200).json({
      success: true,
      session_status: data.session_status,
      end_time: data.end_time,
      items_reviewed: data.items_reviewed,
      items_correct: data.items_correct,
    });
  } catch (error: any) {
    req.log.error('session.finish_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
