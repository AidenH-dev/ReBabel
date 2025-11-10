// pages/api/database/v2/srs/item/create-entry/[itemId].ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateSrsEntryRequest {
  srs_level: number;
  scope: string;
}

interface CreateSrsEntryResponse {
  success: boolean;
  data?: {
    success: boolean;
    entity_id?: string;
    message?: string;
    error?: string;
  };
  error?: string;
}

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse<CreateSrsEntryResponse>
) {
  try {
    const { itemId } = req.query;

    // Validate itemId parameter
    if (!itemId || typeof itemId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing itemId parameter',
      });
    }

    const body: CreateSrsEntryRequest = req.body;

    // Validate request body
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { srs_level, scope } = body;

    // Call the PostgreSQL function via RPC
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('create_item_srs_entry', {
        item_id: itemId,
        data: {
          srs_level: srs_level,
          scope: scope,
        },
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
      });
    }

    // Check if the operation was successful
    if (!data || !data.success) {
      return res.status(400).json({
        success: false,
        data: data,
        error: data?.error || 'Failed to create SRS entry',
      });
    }

    // Return success response
    return res.status(201).json({
      success: true,
      data: data,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateSrsEntryResponse>
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

  return handlePOST(req, res);
})

// Validation helper
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (body === undefined || body === null) {
    return { isValid: false, error: 'Request body is required' };
  }

  if (typeof body.srs_level === 'undefined' || body.srs_level === null) {
    return { isValid: false, error: 'srs_level is required' };
  }

  if (typeof body.srs_level !== 'number') {
    return { isValid: false, error: 'srs_level must be a number' };
  }

  if (!Number.isInteger(body.srs_level)) {
    return { isValid: false, error: 'srs_level must be an integer' };
  }

  if (body.srs_level < 0 || body.srs_level > 9) {
    return { isValid: false, error: 'srs_level must be between 0 and 9' };
  }

  if (!body.scope || typeof body.scope !== 'string') {
    return { isValid: false, error: 'scope must be a non-empty string' };
  }

  if (body.scope.trim().length === 0) {
    return { isValid: false, error: 'scope cannot be empty' };
  }

  return { isValid: true };
}
