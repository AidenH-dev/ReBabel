import { NextApiRequest, NextApiResponse } from 'next';

// Type definitions for the response structure
interface SetMetadata {
  total_sets: number;
  sets_with_title: number;
  sets_with_description: number;
  recently_updated: number;
  retrieved_at: string;
}

interface SetData {
  owner: string;
  title: string;
  description: string | number;
  date_created: string;
  updated_at: string;
  last_studied: string;
  tags: string; // JSON string of array
}

interface UserSet {
  entity_id: string;
  data: SetData;
}

interface GetUserSetsSuccessResponse {
  success: true;
  user_id: string;
  sets: UserSet[];
  metadata: SetMetadata;
}

interface GetUserSetsErrorResponse {
  success: false;
  error: string;
  details?: string;
  user_id?: string;
}

type GetUserSetsResponse = GetUserSetsSuccessResponse | GetUserSetsErrorResponse;

// Type guard functions
function isErrorResponse(response: GetUserSetsResponse): response is GetUserSetsErrorResponse {
  return !response.success;
}

function isSuccessResponse(response: GetUserSetsResponse): response is GetUserSetsSuccessResponse {
  return response.success;
}

interface ApiResponse {
  success: boolean;
  data?: GetUserSetsSuccessResponse;
  error?: string;
  message?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // Extract user ID from the dynamic route
    const { id: userId } = req.query;

    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing user ID in URL path'
      });
    }

    // Validate user ID format (basic validation for non-empty string)
    if (userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User ID cannot be empty'
      });
    }

    // Environment variables for configuration
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lraaascxhlrjdnvmdyyt.supabase.co';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_ANON_KEY) {
      console.error('Missing SUPABASE_ANON_KEY environment variable');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Construct the URL with query parameter
    const supabaseUrl = `${SUPABASE_URL}/functions/v1/get-user-sets?user_id=${encodeURIComponent(userId.trim())}`;

    // Make the request to Supabase function
    const supabaseResponse = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle Supabase response
    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Supabase function error:', errorText);

      // Handle specific error cases
      if (supabaseResponse.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'No sets found for the specified user',
          message: `User ID: ${userId}`
        });
      }

      if (supabaseResponse.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request to Supabase function',
          message: errorText
        });
      }

      return res.status(supabaseResponse.status).json({
        success: false,
        error: `Supabase function failed: ${supabaseResponse.statusText}`,
        message: errorText
      });
    }

    // Parse response
    const responseData: GetUserSetsResponse = await supabaseResponse.json();

    // Check if it's an error response
    if (isErrorResponse(responseData)) {
      return res.status(500).json({
        success: false,
        error: 'Supabase function returned unsuccessful response',
        message: responseData.error || 'Unknown error from Supabase'
      });
    }

    // TypeScript now knows this is GetUserSetsSuccessResponse
    // Transform tags from string to array if needed (for consistency)
    const transformedSets = responseData.sets.map(set => ({
      ...set,
      data: {
        ...set.data,
        tags: typeof set.data.tags === 'string' 
          ? (() => {
              try {
                return JSON.parse(set.data.tags);
              } catch {
                return set.data.tags; // Return as-is if parsing fails
              }
            })()
          : set.data.tags
      }
    }));

    const transformedResponse = {
      ...responseData,
      sets: transformedSets
    };

    return res.status(200).json({
      success: true,
      data: transformedResponse,
      message: `Retrieved ${responseData.metadata.total_sets} sets for user ${userId}`
    });

  } catch (error) {
    console.error('API Error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        error: 'Invalid JSON response from Supabase function'
      });
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({
        success: false,
        error: 'Failed to connect to Supabase function'
      });
    }

    // Generic error handler
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export function required by Pages Router
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    
    case 'POST':
    case 'PUT':
    case 'DELETE':
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use GET to retrieve user sets.'
      });
    
    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}