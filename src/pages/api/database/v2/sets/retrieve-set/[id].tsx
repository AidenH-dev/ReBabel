import { NextApiRequest, NextApiResponse } from 'next';

// Type definitions for the response structure
interface ExampleSentence {
  english: string;
  japanese: string;
}

interface VocabItem {
  id: string;  // ADDED: Entity ID for the vocab item
  kana: string;
  tags: string[];
  type: 'vocab';
  audio: string;
  kanji: string;
  owner: string;
  english: string;
  srs_level: number;
  known_status: string;
  lexical_category: string;
  example_sentences: string;
  srs_reviewed_last: string | null;
}

interface GrammarItem {
  id: string;  // ADDED: Entity ID for the grammar item
  tags: string[];
  type: 'grammar';
  audio: string;
  notes: string;
  owner: string;
  title: string;
  topic: string;
  srs_level: number;
  description: string;
  known_status: string;
  example_sentences: ExampleSentence[];
  srs_reviewed_last: string | null;
}

type SetItem = VocabItem | GrammarItem;

interface SetData {
  owner: string;
  title: string;
  description: string | number;
  date_created: string;
  updated_at: string;
  last_studied: string;
  tags: string[] | string; // Can be array or JSON string
}

interface SetMetadata {
  total_items: number;
  vocab_count: number;
  grammar_count: number;
  retrieved_at: string;
}

interface GetSetSuccessResponse {
  success: true;
  set_id: string;
  data: {
    set: SetData;
    items: SetItem[];
  };
  metadata: SetMetadata;
}

interface GetSetErrorResponse {
  success: false;
  error: string;
  details?: string;
  set_id?: string;
}

type GetSetResponse = GetSetSuccessResponse | GetSetErrorResponse;

// Type guard functions
function isErrorResponse(response: GetSetResponse): response is GetSetErrorResponse {
  return !response.success;
}

function isSuccessResponse(response: GetSetResponse): response is GetSetSuccessResponse {
  return response.success;
}

interface ApiResponse {
  success: boolean;
  data?: GetSetSuccessResponse;
  error?: string;
  message?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // Extract set ID from the dynamic route
    const { id: setId } = req.query;

    // Validate set ID
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing set ID in URL path'
      });
    }

    // Validate set ID format (basic validation for non-empty string)
    if (setId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Set ID cannot be empty'
      });
    }

    // Environment variables for configuration
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lraaascxhlrjdnvmdyyt.supabase.co';
    const SUPABASE_ANON_KEY = process.env.NEXT_SUPABASE_ANON_KEY;

    if (!SUPABASE_ANON_KEY) {
      console.error('Missing SUPABASE_ANON_KEY environment variable');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Construct the URL with query parameter
    const supabaseUrl = `${SUPABASE_URL}/functions/v1/get-set?id=${encodeURIComponent(setId.trim())}`;

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
          error: 'Set not found',
          message: `Set ID: ${setId}`
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
    const responseData: GetSetResponse = await supabaseResponse.json();

    // Check if it's an error response
    if (isErrorResponse(responseData)) {
      return res.status(500).json({
        success: false,
        error: 'Supabase function returned unsuccessful response',
        message: responseData.error || 'Unknown error from Supabase'
      });
    }

    // TypeScript now knows this is GetSetSuccessResponse
    // Transform tags from string to array if needed (for consistency)
    const transformedSet = {
      ...responseData.data.set,
      tags: typeof responseData.data.set.tags === 'string'
        ? (() => {
            try {
              return JSON.parse(responseData.data.set.tags);
            } catch {
              return responseData.data.set.tags; // Return as-is if parsing fails
            }
          })()
        : responseData.data.set.tags
    };

    const transformedResponse = {
      ...responseData,
      data: {
        ...responseData.data,
        set: transformedSet
      }
    };

    return res.status(200).json({
      success: true,
      data: transformedResponse,
      message: `Retrieved set ${setId} with ${responseData.metadata.total_items} items`
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
        error: 'Method not allowed. Use GET to retrieve set details.'
      });
    
    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}