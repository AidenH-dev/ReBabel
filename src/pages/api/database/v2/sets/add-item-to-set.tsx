// pages/api/database/v2/sets/add-item-to-set.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AddItemRequest {
  set_id: string;
  item_type: 'vocab' | 'grammar';
  item_data: Record<string, any>;
}

interface AddItemResponse {
  success: boolean;
  data?: {
    item_id: string;
    relation_id: string;
    set_item_num_updated: boolean;
    new_item_count: number;
    transaction_id: string;
    success: boolean;
    message: string;
  };
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddItemResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const body: AddItemRequest = req.body;

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { set_id, item_type, item_data } = body;

    // Convert item_data to JSON string
    const itemJsonString = JSON.stringify(item_data);

    // Call the PostgreSQL function directly via RPC
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('add_item_to_set', {
        set_uuid: set_id,
        item_type: item_type,
        item_json: itemJsonString,
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
      });
    }

    // Check if the operation was successful
    const result = data[0];
    
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        error: result?.message || 'Failed to add item to set',
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

// Validation helper
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body.set_id || typeof body.set_id !== 'string') {
    return { isValid: false, error: 'set_id must be a valid string' };
  }

  if (!body.item_type || typeof body.item_type !== 'string') {
    return { isValid: false, error: 'item_type must be a string' };
  }

  if (!['vocab', 'grammar'].includes(body.item_type)) {
    return {
      isValid: false,
      error: 'item_type must be either "vocab" or "grammar"',
    };
  }

  if (!body.item_data || typeof body.item_data !== 'object' || Array.isArray(body.item_data)) {
    return { isValid: false, error: 'item_data must be an object' };
  }

  if (Object.keys(body.item_data).length === 0) {
    return { isValid: false, error: 'item_data cannot be empty' };
  }

  // Validate required fields based on item type
  if (body.item_type === 'vocab') {
    if (!body.item_data.owner) {
      return { isValid: false, error: 'item_data.owner is required for vocab items' };
    }
    if (!body.item_data.english) {
      return { isValid: false, error: 'item_data.english is required for vocab items' };
    }
    if (!body.item_data.kana) {
      return { isValid: false, error: 'item_data.kana is required for vocab items' };
    }
  }

  if (body.item_type === 'grammar') {
    if (!body.item_data.owner) {
      return { isValid: false, error: 'item_data.owner is required for grammar items' };
    }
    if (!body.item_data.title) {
      return { isValid: false, error: 'item_data.title is required for grammar items' };
    }
    if (!body.item_data.description) {
      return { isValid: false, error: 'item_data.description is required for grammar items' };
    }
  }

  return { isValid: true };
}