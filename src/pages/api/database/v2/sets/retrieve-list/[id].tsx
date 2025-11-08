import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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

interface ApiResponse {
  success: boolean;
  data?: GetUserSetsSuccessResponse;
  error?: string;
  message?: string;
  details?: string;
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

    // Call the get_user_sets RPC function directly
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_sets', {
        user_id: userId.trim()
      });

    // Handle database errors
    if (error) {
      console.error('Supabase RPC error:', error);

      // Return 404 if no data found
      if (data === null || data === undefined) {
        return res.status(404).json({
          success: false,
          error: 'No sets found for the specified user',
          message: `User ID: ${userId}`
        });
      }

      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
        details: error.details
      });
    }

    // Check if data was found
    if (data === null || data === undefined) {
      return res.status(404).json({
        success: false,
        error: 'No sets found for the specified user',
        message: `User ID: ${userId}`
      });
    }

    // Parse the data if it's returned as a string
    let setsArray: UserSet[] = [];
    if (typeof data === 'string') {
      try {
        setsArray = JSON.parse(data);
      } catch (parseError) {
        console.error('Failed to parse response data:', parseError);
        setsArray = Array.isArray(data) ? data : [];
      }
    } else if (Array.isArray(data)) {
      setsArray = data;
    }

    // Calculate metadata for the sets
    const metadata: SetMetadata = {
      total_sets: setsArray.length,
      sets_with_title: setsArray.filter((set) => set.data && set.data.title && set.data.title.trim().length > 0).length,
      sets_with_description: setsArray.filter((set) => set.data && set.data.description && String(set.data.description).trim().length > 0).length,
      recently_updated: setsArray.filter((set) => {
        if (!set.data || !set.data.updated_at) return false;
        const updatedAt = new Date(set.data.updated_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return updatedAt > thirtyDaysAgo;
      }).length,
      retrieved_at: new Date().toISOString()
    };

    // Transform tags from string to array if needed (for consistency)
    const transformedSets = setsArray.map(set => ({
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

    const response: GetUserSetsSuccessResponse = {
      success: true,
      user_id: userId,
      sets: transformedSets,
      metadata: metadata
    };

    return res.status(200).json({
      success: true,
      data: response,
      message: `Retrieved ${metadata.total_sets} sets for user ${userId}`
    });

  } catch (error) {
    console.error('API Error:', error);

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