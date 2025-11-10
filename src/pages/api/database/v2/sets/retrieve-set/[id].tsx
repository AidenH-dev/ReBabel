import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  srs_enabled: string; // 'true' or 'false' as string from database
  tags: string[] | string; // Can be array or JSON string
  set_type?: 'vocab' | 'grammar'; // 'vocab', 'grammar', or undefined for legacy sets
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(setId.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid set ID format',
        message: 'ID must be a valid UUID'
      });
    }

    // Call the PostgreSQL function via RPC
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_with_items_v2', {
        set_entity_id: setId.trim()
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
        message: error.hint || error.details || 'Failed to retrieve set'
      });
    }

    // Check if set was found
    if (data === null || data === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Set not found',
        message: `Set ID: ${setId}`
      });
    }

    // Parse the data if it's returned as a string
    let responseData = data;
    if (typeof data === 'string') {
      try {
        responseData = JSON.parse(data);
      } catch (parseError) {
        console.error('Failed to parse response data:', parseError);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse database response'
        });
      }
    }

    // Transform tags from string to array if needed (for consistency)
    const transformedSet = {
      ...responseData.set,
      tags: typeof responseData.set.tags === 'string'
        ? (() => {
            try {
              return JSON.parse(responseData.set.tags);
            } catch {
              return responseData.set.tags; // Return as-is if parsing fails
            }
          })()
        : responseData.set.tags
    };

    // Calculate metadata
    const items = responseData.items || [];
    const metadata = {
      total_items: items.length,
      vocab_count: items.filter((item: any) => item.type === 'vocab').length,
      grammar_count: items.filter((item: any) => item.type === 'grammar').length,
      retrieved_at: new Date().toISOString()
    };

    // Build response in the same format as before
    const enrichedResponse: GetSetSuccessResponse = {
      success: true,
      set_id: setId,
      data: {
        set: transformedSet,
        items: items
      },
      metadata: metadata
    };

    return res.status(200).json({
      success: true,
      data: enrichedResponse,
      message: `Retrieved set ${setId} with ${metadata.total_items} items`
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
// Protected with Auth0 - requires valid session
export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
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
        error: 'Method not allowed. Use GET to retrieve set details.'
      });

    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
})