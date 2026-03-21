import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { withLogger } from '@/lib/withLogger';

interface BugReportResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  count?: number;
}

async function handleGET(
  req: any,
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

    // Get query parameters for filtering
    const { start_time, end_time } = req.query;

    // Build the RPC call parameters
    const rpcParams: any = {
      start_time: start_time || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      end_time: end_time || new Date().toISOString(),
      entity_type: 'USER-BUG-REPORT'
    };

    // Call the RPC function to retrieve bug reports
    const { data, error } = await supabaseKvs
      .rpc('get_admin_info_entities_by_time_range', {
        data: rpcParams
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_admin_info_entities_by_time_range', error: error.message, code: error.code });
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
    req.log.error('bug_report_list.error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export function required by Pages Router
// Protected with Auth0 - requires valid session
export default withApiAuthRequired(withLogger(async function handler(req, res: NextApiResponse<BugReportResponse>) {
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
}));
