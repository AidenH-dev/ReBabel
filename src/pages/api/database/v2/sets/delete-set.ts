// pages/api/database/v2/sets/delete-set.ts
import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface DeleteSetRequest {
  set_id: string;
  also_delete_items?: boolean;
}

interface DeleteSetResponse {
  success: boolean;
  data?: {
    set_deleted: boolean;
    set_properties_deleted: number;
    items_removed: number;
    vocab_items_deleted: number;
    grammar_items_deleted: number;
    relations_deleted: number;
    transaction_id: string;
    success: boolean;
    message: string;
  };
  error?: string;
  message?: string;
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const body: DeleteSetRequest = req.body;

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      req.log.warn('validation.failed', { error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { set_id, also_delete_items = false } = body;

    // Call the PostgreSQL function directly via RPC
    const { data, error } = await supabaseKvs
      .rpc('delete_set_completely', {
        set_uuid: set_id,
        also_delete_items: also_delete_items,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'delete_set_completely', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
      });
    }

    // Check if the operation was successful
    const result = data[0];
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        error: result?.message || 'Failed to delete set',
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });

  } catch (error) {
    req.log.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
})

// Validation helper
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body.set_id || typeof body.set_id !== 'string') {
    return { isValid: false, error: 'set_id must be a valid string' };
  }

  if (body.also_delete_items !== undefined && typeof body.also_delete_items !== 'boolean') {
    return { isValid: false, error: 'also_delete_items must be a boolean' };
  }

  return { isValid: true };
}