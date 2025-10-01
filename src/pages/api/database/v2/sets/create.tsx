import { NextApiRequest, NextApiResponse } from 'next';

// Type definitions based on the cURL data structure
interface ExampleSentence {
  japanese: string;
  english: string;
}

interface VocabItem {
  type: 'vocab';
  owner: string;
  known_status: 'unknown' | 'known';
  srs_level: number;
  srs_reviewed_last: string | null;
  english: string;
  kana: string;
  kanji: string;
  lexical_category: string;
  example_sentences: string;
  tags: string[];
  audio: string;
}

interface GrammarItem {
  type: 'grammar';
  owner: string;
  known_status: 'unknown' | 'known';
  srs_level: number;
  srs_reviewed_last: string | null;
  title: string;
  description: string;
  topic: string;
  notes: string;
  example_sentences: ExampleSentence[];
  tags: string[];
  audio: string;
}

type StudyItem = VocabItem | GrammarItem;

interface SetData {
  owner: string;
  title: string;
  description: number | string;
  date_created: string;
  updated_at: string;
  last_studied: string;
  tags: string[];
  item_num?: number;
}

interface CreateSetRequest {
  set: SetData;
  items: StudyItem[];
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // Parse the request body
    const body: CreateSetRequest = req.body;

    // Basic validation
    if (!body.set || !body.items) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: set and items are required'
      });
    }

    // Validate set data
    const { set, items } = body;
    if (!set.owner || !set.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required set fields: owner and title are required'
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items must be a non-empty array'
      });
    }

    // Add item count to the set object
    const updatedSet = {
      ...set,
      item_num: items.length
    };

    // Create updated body with the item count
    const updatedBody = {
      set: updatedSet,
      items
    };

    // Environment variables for configuration
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lraaascxhlrjdnvmdyyt.supabase.co';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Make the request to Supabase function
    const supabaseResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-full-set`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedBody),
    });

    // Handle Supabase response
    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Supabase function error:', errorText);

      return res.status(supabaseResponse.status).json({
        success: false,
        error: `Supabase function failed: ${supabaseResponse.statusText}`,
        message: errorText
      });
    }

    // Parse successful response
    const responseData = await supabaseResponse.json();

    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Set created successfully'
    });

  } catch (error) {
    console.error('API Error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body'
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
    case 'POST':
      return handlePOST(req, res);
    
    case 'GET':
    case 'PUT':
    case 'DELETE':
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST to create a set.'
      });
    
    default:
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}