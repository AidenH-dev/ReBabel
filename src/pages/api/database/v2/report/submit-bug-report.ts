import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { notifyBugReport } from '@/lib/webhooks/peko';
import { notifySlackBugReport } from '@/lib/webhooks/slack';
import { createRateLimiter } from '@/lib/rateLimit';
import { supabaseKvs } from '@/lib/supabaseKvs';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

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
  req: AuthedRequest,
  res: NextApiResponse<ApiResponse>,
  userId: string,
  userEmail: string
) {
  try {
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

    // Call the RPC function to create bug report
    const { data, error } = await supabaseKvs
      .rpc('create_user_bug_report_v1', {
        data: bugReportData
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'create_user_bug_report_v1', error: error.message, code: error.code });
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

    const bugData = {
      reportId: data.entity_id,
      userId: userId,
      userEmail: userEmail,
      location: body.form_json?.bug_location,
      feature: body.form_json?.bugged_feature,
      description: body.form_json?.user_details,
    };
    notifyBugReport(bugData);
    notifySlackBugReport(bugData);

    return res.status(201).json({
      success: true,
      data: {
        entity_id: data.entity_id,
        message: data.message
      },
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    req.log.error('bug_report.error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export function required by Pages Router
// Protected with withAuth — requires valid session
export default withAuth(async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (!limiter.check(req.auth0Sub)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res, req.userId, req.auth0Email);

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
