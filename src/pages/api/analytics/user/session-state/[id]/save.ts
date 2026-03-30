import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERROR_STATUS_MAP: Record<string, number> = {
  session_not_found: 404,
  not_owner: 403,
  session_not_active: 409,
};

interface ApiResponse {
  success: boolean;
  stateStatus?: string;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    const { completedItems = [], completedPhases, ...progressFields } = req.body || {};

    if (Array.isArray(completedItems) && completedItems.length > 50000) {
      return res.status(400).json({ success: false, error: 'completedItems exceeds maximum size of 50,000' });
    }

    // Map camelCase body fields to snake_case progress object
    const progress: Record<string, string> = {};
    if (progressFields.currentIndex !== undefined) progress.current_index = String(progressFields.currentIndex);
    if (progressFields.statsCorrect !== undefined) progress.stats_correct = String(progressFields.statsCorrect);
    if (progressFields.statsIncorrect !== undefined) progress.stats_incorrect = String(progressFields.statsIncorrect);
    if (progressFields.statsAttempts !== undefined) progress.stats_attempts = String(progressFields.statsAttempts);
    if (progressFields.itemsCompleted !== undefined) progress.items_completed = String(progressFields.itemsCompleted);
    if (progressFields.currentPhase !== undefined) progress.current_phase = String(progressFields.currentPhase);
    if (progressFields.currentChunkIndex !== undefined) progress.current_chunk_index = String(progressFields.currentChunkIndex);
    if (progressFields.chunksCompleted !== undefined) progress.chunks_completed = String(progressFields.chunksCompleted);
    if (progressFields.analyticsSessionId !== undefined) progress.analytics_session_id = String(progressFields.analyticsSessionId);
    if (progressFields.batchSaveComplete !== undefined) progress.batch_save_complete = String(progressFields.batchSaveComplete);
    if (progressFields.quizMode !== undefined) progress.quiz_mode = String(progressFields.quizMode);
    if (progressFields.quizType !== undefined) progress.quiz_type = String(progressFields.quizType);

    // Expand completedPhases into completed_phase.* properties
    if (completedPhases && typeof completedPhases === 'object') {
      for (const [phase, val] of Object.entries(completedPhases)) {
        progress[`completed_phase.${phase}`] = String(val);
      }
    }

    // Map completedItems from camelCase -- pass KB item UUID as item_id
    // The RPC resolves the session_item entity internally
    const rpcItems = completedItems.map((item: any) => ({
      item_id: item.itemId,
      correct: item.correct,
      ...(item.mistakes !== undefined && { mistakes: String(item.mistakes) }),
    }));

    const { data, error } = await supabaseKvs.rpc('save_session_progress', {
      p_owner: req.userId,
      p_entity_id: id,
      p_progress: progress,
      p_completed_items: rpcItems,
    });

    if (error) {
      req.log.error('rpc.failed', { fn: 'save_session_progress', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to save session progress' });
    }

    if (!data.success) {
      const status = ERROR_STATUS_MAP[data.error] || 500;
      return res.status(status).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      stateStatus: data.state_status,
    });
  } catch (error: any) {
    req.log.error('session_state.save_failed', { error: error?.message || String(error) });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
