// pages/api/database/v2/sets/update-from-full-set.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
type EntityType = 'set' | 'grammar' | 'vocab';

interface UpdateEntityRequest {
  entityType: EntityType;
  entityId: string;
  updates: Record<string, any>;
}

interface UpdateEntityResponse {
  success: boolean;
  data?: {
    updated_count: number;
    inserted_count: number;
    transaction_id: string;
    properties_changed: string[];
  };
  error?: string;
}

// Map entity types to their corresponding SQL functions
const FUNCTION_MAP: Record<EntityType, string> = {
  set: 'update_set_by_id',
  grammar: 'update_grammar_entity_by_id',
  vocab: 'update_vocab_entity_by_id',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateEntityResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Parse request body
    const body: UpdateEntityRequest = req.body;

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { entityType, entityId, updates } = body;

    // Get the appropriate function name
    const functionName = FUNCTION_MAP[entityType];

    // Convert updates object to JSON string for the SQL function
    const updatesJson = JSON.stringify(updates);

    // Call the appropriate Supabase function WITH SCHEMA SPECIFIED
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')  // ← ADDED THIS LINE
      .rpc(functionName, {
        entity_uuid: entityId,
        json_updates: updatesJson,
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: data[0], // RPC returns an array with one result
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
  if (!body.entityType) {
    return { isValid: false, error: 'entityType is required' };
  }

  if (!['set', 'grammar', 'vocab'].includes(body.entityType)) {
    return {
      isValid: false,
      error: 'entityType must be one of: set, grammar, vocab',
    };
  }

  if (!body.entityId || typeof body.entityId !== 'string') {
    return { isValid: false, error: 'entityId must be a valid string' };
  }

  if (!body.updates || typeof body.updates !== 'object') {
    return { isValid: false, error: 'updates must be an object' };
  }

  if (Object.keys(body.updates).length === 0) {
    return { isValid: false, error: 'updates object cannot be empty' };
  }

  return { isValid: true };
}