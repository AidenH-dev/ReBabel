// pages/api/database/v2/sets/delete-set.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteSetResponse>
) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

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
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { set_id, also_delete_items = false } = body;

    // Call the PostgreSQL function directly via RPC
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('delete_set_completely', {
        set_uuid: set_id,
        also_delete_items: also_delete_items,
      });

    if (error) {
      console.error('Supabase RPC error:', error);
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
    console.error('Unexpected error:', error);
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