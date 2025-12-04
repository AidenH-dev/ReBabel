import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

interface BugReportResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  count?: number;
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse<BugReportResponse>
) {
  try {
    // Get Auth0 session and extract user credentials
    const session = await getSession(req, res);
    if (!session?.user?.sub || !session?.user?.email) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - authentication required'
      });
    }

    // Check if user is admin
    const isAdmin = session.user['https://rebabel.org/app_metadata']?.isAdmin || false;
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - admin access required'
      });
    }

    // Environment variables for configuration
    const SUPABASE_URL = process.env.NEXT_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get query parameters for filtering
    const { start_time, end_time } = req.query;

    // Build the RPC call parameters
    const rpcParams: any = {
      start_time: start_time || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      end_time: end_time || new Date().toISOString(),
      entity_type: 'USER-BUG-REPORT'
    };

    // Call the RPC function to retrieve bug reports
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_admin_info_entities_by_time_range', {
        data: rpcParams
      });

    if (error) {
      console.error('Failed to retrieve bug reports:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve bug reports',
        message: error.message
      });
    }

    // Check if the RPC function returned a success response
    if (!data || !data.success) {
      return res.status(400).json({
        success: false,
        error: data?.error || 'Failed to retrieve bug reports',
        message: data?.message
      });
    }

    return res.status(200).json({
      success: true,
      data: data.entities || [],
      count: data.count || 0,
      message: 'Bug reports retrieved successfully'
    });

  } catch (error) {
    console.error('API Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export function required by Pages Router
// Protected with Auth0 - requires valid session
export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse<BugReportResponse>) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub || !session?.user?.email) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  // Check if user is admin
  const isAdmin = session.user['https://rebabel.org/app_metadata']?.isAdmin || false;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - admin access required'
    });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);

    case 'POST':
    case 'PUT':
    case 'DELETE':
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use GET to retrieve bug reports.'
      });

    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
});
