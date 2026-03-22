import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';
const { categorizeWord } = require('@/lib/kuromoji-categorize');

// Kuromoji dict loading + processing 600+ items needs more than 15s
export const config = {
  maxDuration: 60,
};

interface AutoCategorizeResponse {
  success: boolean;
  categorized_count?: number;
  skipped_count?: number;
  missing_kanji_count?: number;
  low_confidence_count?: number;
  results?: Array<{ entity_id: string; lexical_category: string }>;
  error?: string;
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { set_id } = req.body;

    if (!set_id || typeof set_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid set_id',
      });
    }

    // Fetch the full set with items
    const { data: setData, error: fetchError } = await supabaseKvs
      .rpc('get_set_with_items_v2', { set_entity_id: set_id });

    if (fetchError) {
      req.log.error('rpc.failed', { fn: 'get_set_with_items_v2', error: fetchError.message, code: fetchError.code });
      return res.status(500).json({
        success: false,
        error: `Database error: ${fetchError.message}`,
      });
    }

    if (!setData) {
      return res.status(404).json({
        success: false,
        error: 'Set not found',
      });
    }

    const parsed = typeof setData === 'string' ? JSON.parse(setData) : setData;
    const items = parsed.items || [];

    // Filter to only uncategorized vocab items
    const uncategorized = items.filter(
      (item: any) =>
        item.type === 'vocab' &&
        (!item.lexical_category || item.lexical_category.trim() === '')
    );

    if (uncategorized.length === 0) {
      return res.status(200).json({
        success: true,
        categorized_count: 0,
        skipped_count: items.filter((i: any) => i.type === 'vocab').length,
        results: [],
      });
    }

    const results: Array<{ entity_id: string; lexical_category: string }> = [];
    let skippedCount = 0;
    let missingKanjiCount = 0;
    let lowConfidenceCount = 0;

    for (const item of uncategorized) {
      // Track items missing kanji (categorization may be less accurate)
      if (!item.kanji || item.kanji.trim() === '') {
        missingKanjiCount++;
      }

      const result = await categorizeWord(item.kana, item.kanji);

      if (result && result.lexical_category) {
        if (result.confidence === 'low') {
          lowConfidenceCount++;
        }

        // Update the item's lexical_category via RPC
        const { error: updateError } = await supabaseKvs
          .rpc('update_vocab_entity_by_id', {
            entity_uuid: item.id,
            json_updates: JSON.stringify({
              lexical_category: result.lexical_category,
              ...(result.verb_group && { verb_group: result.verb_group }),
            }),
          });

        if (!updateError) {
          results.push({
            entity_id: item.id,
            lexical_category: result.lexical_category,
          });
        } else {
          req.log.error('rpc.failed', { fn: 'update_vocab_entity_by_id', error: updateError.message, code: updateError.code, entityId: item.id });
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // Count items that already had categories
    const alreadyCategorized = items.filter(
      (i: any) =>
        i.type === 'vocab' &&
        i.lexical_category &&
        i.lexical_category.trim() !== ''
    ).length;

    // Mark set as auto-categorized
    await supabaseKvs
      .rpc('update_set_by_id', {
        entity_uuid: set_id,
        json_updates: JSON.stringify({ auto_categorized: 'true' }),
      });

    return res.status(200).json({
      success: true,
      categorized_count: results.length,
      skipped_count: skippedCount + alreadyCategorized,
      missing_kanji_count: missingKanjiCount,
      low_confidence_count: lowConfidenceCount,
      results,
    });
  } catch (error) {
    req.log.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});
