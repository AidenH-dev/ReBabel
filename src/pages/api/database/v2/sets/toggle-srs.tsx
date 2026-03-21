import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { withLogger } from '@/lib/withLogger';

interface ToggleSrsRequest {
  setId: string;
  srsEnabled: boolean;
}

interface ToggleSrsResult {
  eid: string;
  action_taken: string;
  previous_value: string | null;
  new_value: string;
  transaction_id: string;
  changed_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: ToggleSrsResult;
  error?: string;
  message?: string;
}

export default withApiAuthRequired(withLogger(async function handler(
  req,
  res
) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    // Validate request body
    const { setId, srsEnabled }: ToggleSrsRequest = req.body;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required field',
        message: 'setId must be a valid string'
      });
    }

    if (typeof srsEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid field type',
        message: 'srsEnabled must be a boolean'
      });
    }

    // Call the PostgreSQL function via RPC
    const { data, error } = await supabaseKvs
      .rpc('toggle_set_srs_enabled', {
        set_uuid: setId,
        enabled: srsEnabled
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'toggle_set_srs_enabled', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
        message: error.hint || error.details || 'Failed to toggle SRS status'
      });
    }

    // Extract the result (function returns an array with one row)
    const result: ToggleSrsResult = data[0];

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'No data returned from database',
        message: 'The operation completed but no result was returned'
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: `SRS ${srsEnabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    req.log.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}))
