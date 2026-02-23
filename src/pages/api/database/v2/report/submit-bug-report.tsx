import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { notifyBugReport } from '@/lib/webhooks/peko';

interface BugReportRequest {
  browser_type?: string;
  time_submitted: string;
  form_json: Record<string, any>;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  // Validate time_submitted
  if (!body.time_submitted || typeof body.time_submitted !== 'string' || body.time_submitted.trim() === '') {
    return { isValid: false, error: 'time_submitted is required and must be a non-empty string' };
  }

  // Validate form_json
  if (!body.form_json || typeof body.form_json !== 'object') {
    return { isValid: false, error: 'form_json is required and must be a valid JSON object' };
  }

  // Validate browser_type if provided
  if (body.browser_type !== undefined && body.browser_type !== null && typeof body.browser_type !== 'string') {
    return { isValid: false, error: 'browser_type must be a string if provided' };
  }

  return { isValid: true };
}

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
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

    const userId = session.user.sub;
    const userEmail = session.user.email;

    // Parse and validate request body
    const body: BugReportRequest = req.body;
    const validation = validateRequest(body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Prepare data for the RPC function
    // Use server-side timestamp for accuracy instead of client-submitted time
    const serverTimestamp = new Date().toISOString().replace('T', ' ').replace('Z', '+00');
    const bugReportData = {
      user_id: userId,
      user_email: userEmail,
      browser_type: body.browser_type || null,
      time_submitted: serverTimestamp,
      form_json: body.form_json
    };

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

    // Call the RPC function to create bug report
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('create_user_bug_report_v1', {
        data: bugReportData
      });

    if (error) {
      console.error('Failed to create bug report:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create bug report',
        message: error.message
      });
    }

    // Check if the RPC function returned a success response
    if (!data || !data.success) {
      return res.status(400).json({
        success: false,
        error: data?.error || 'Failed to create bug report',
        message: data?.message
      });
    }

    notifyBugReport({
      reportId: data.entity_id,
      userId: userId,
      userEmail: userEmail,
      location: body.form_json?.bug_location,
      feature: body.form_json?.bugged_feature,
      description: body.form_json?.user_details,
    });

    return res.status(201).json({
      success: true,
      data: {
        entity_id: data.entity_id,
        message: data.message
      },
      message: 'Bug report submitted successfully'
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
export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub || !session?.user?.email) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);

    case 'GET':
    case 'PUT':
    case 'DELETE':
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST to submit a bug report.'
      });

    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
})
