// pages/api/database/v2/sets/update-srs-level/[setId].tsx
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SRSLevelUpdate {
  itemId: string; // The item ID (e.g., "vocab-1", "grammar-2")
  itemType: 'vocabulary' | 'grammar';
  newLevel: number;
}

interface UpdateSRSLevelRequest {
  updates: SRSLevelUpdate[];
}

interface UpdateSRSLevelResponse {
  success: boolean;
  data?: {
    updated_count: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateSRSLevelResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { setId } = req.query;
    const body: UpdateSRSLevelRequest = req.body;

    // Validate request
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'setId is required in URL path',
      });
    }

    if (!body.updates || !Array.isArray(body.updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates must be an array',
      });
    }

    if (body.updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'updates array cannot be empty',
      });
    }

    // Validate each update
    for (const update of body.updates) {
      if (!update.itemId || typeof update.itemId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Each update must have a valid itemId',
        });
      }
      if (!update.itemType || !['vocabulary', 'grammar'].includes(update.itemType)) {
        return res.status(400).json({
          success: false,
          error: 'Each update must have itemType of "vocabulary" or "grammar"',
        });
      }
      if (typeof update.newLevel !== 'number' || update.newLevel < 1) {
        return res.status(400).json({
          success: false,
          error: 'Each update must have a newLevel >= 1',
        });
      }
    }

    // For each update, we need to update the item's SRS level
    // This is a simplified implementation that assumes items are stored with an srs_level field
    // You may need to adjust this based on your actual database schema

    let updatedCount = 0;

    for (const update of body.updates) {
      const { itemId, itemType, newLevel } = update;

      // Call the update function based on item type
      const functionName = itemType === 'vocabulary'
        ? 'update_vocab_entity_by_id'
        : 'update_grammar_entity_by_id';

      // Extract the actual item UUID from the itemId
      // This depends on how you're storing the relationship between sets and items
      // For now, we'll use a placeholder approach
      // You'll need to implement the actual logic based on your schema

      const { error } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc(functionName, {
          entity_uuid: itemId,
          json_updates: JSON.stringify({ srs_level: newLevel }),
        });

      if (error) {
        console.error(`Error updating ${itemType} ${itemId}:`, error);
        // Continue with other updates even if one fails
      } else {
        updatedCount++;
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        updated_count: updatedCount,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
