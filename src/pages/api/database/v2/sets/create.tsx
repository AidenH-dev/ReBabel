import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { createRateLimiter } from '@/lib/rateLimit';
import { supabaseKvs } from '@/lib/supabaseKvs';
const { categorizeWord } = require('@/lib/kuromoji-categorize');

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

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
  description: string;
  date_created: string;
  updated_at: string;
  last_studied: string;
  tags: string[];
  srs_enabled?: string;
  item_num?: number;
  set_type?: 'vocab' | 'grammar';
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

async function handlePOST(req: NextApiRequest, res: NextApiResponse<ApiResponse>, resolvedUserId: string) {
  try {
    // Parse the request body
    const body: CreateSetRequest = req.body;

    // Basic validation
    if (!body || typeof body !== 'object' || body.set == null || !Array.isArray(body.items)) {
      return res.status(400).json({
        success: false,
        error: 'Payload must include { set, items[] } where items have type and item data'
      });
    }

    const { set, items } = body;

    // Override owner with resolved usr_ ID on set and all items
    set.owner = resolvedUserId;
    for (const item of items) {
      item.owner = resolvedUserId;
    }

    // Validate items array
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== 'object' || !item.type || (item.type !== 'vocab' && item.type !== 'grammar')) {
        return res.status(400).json({
          success: false,
          error: `Item at index ${i} must have type 'vocab' or 'grammar'`
        });
      }
    }

    // Determine set_type based on items
    const firstItemType = items.length > 0 ? items[0].type : undefined;
    const setType = (firstItemType === 'vocab' || firstItemType === 'grammar') ? firstItemType : undefined;

    // Add item count and set_type to the set object
    const updatedSet = {
      ...set,
      item_num: items.length,
      set_type: setType
    };

    // 1) Insert set
    const setRpc = await supabaseKvs
      .rpc('insert_json_to_set', {
        json_array_input: JSON.stringify([updatedSet])
      });

    if (setRpc.error) {
      (req as any).log?.error('rpc.failed', { fn: 'insert_json_to_set', error: setRpc.error.message, code: setRpc.error.code });
      return res.status(500).json({
        success: false,
        error: 'Failed to insert set',
        message: setRpc.error.message
      });
    }

    const setData = Array.isArray(setRpc.data) ? setRpc.data[0] : null;
    const setEntityId = setData?.entity_ids?.[0] ?? null;

    if (!setData || !setEntityId) {
      return res.status(500).json({
        success: false,
        error: 'Unexpected set RPC response shape'
      });
    }

    // 2) Separate items by type and preserve order
    const vocabItems: VocabItem[] = [];
    const grammarItems: GrammarItem[] = [];
    const itemTypeMap: Array<{ index: number; type: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      itemTypeMap.push({
        index: i,
        type: item.type
      });
      if (item.type === 'vocab') {
        vocabItems.push(item as VocabItem);
      } else if (item.type === 'grammar') {
        grammarItems.push(item as GrammarItem);
      }
    }

    // 3) Insert vocabulary items if any
    let vocabEntityIds: string[] = [];
    if (vocabItems.length > 0) {
      const vocabRpc = await supabaseKvs
        .rpc('insert_json_to_kb_vocab', {
          json_array_input: JSON.stringify(vocabItems)
        });

      if (vocabRpc.error) {
        (req as any).log?.error('rpc.failed', { fn: 'insert_json_to_kb_vocab', error: vocabRpc.error.message, code: vocabRpc.error.code });
        return res.status(500).json({
          success: false,
          error: 'Failed to insert vocabulary',
          message: vocabRpc.error.message
        });
      }

      const vocabData = Array.isArray(vocabRpc.data) ? vocabRpc.data[0] : null;
      vocabEntityIds = vocabData?.entity_ids ?? [];

      if (!vocabData || !Array.isArray(vocabEntityIds)) {
        return res.status(500).json({
          success: false,
          error: 'Unexpected vocabulary RPC response shape'
        });
      }
    }

    // 4) Insert grammar items if any
    let grammarEntityIds: string[] = [];
    if (grammarItems.length > 0) {
      const grammarRpc = await supabaseKvs
        .rpc('insert_json_to_kb_grammar', {
          json_array_input: JSON.stringify(grammarItems)
        });

      if (grammarRpc.error) {
        (req as any).log?.error('rpc.failed', { fn: 'insert_json_to_kb_grammar', error: grammarRpc.error.message, code: grammarRpc.error.code });
        return res.status(500).json({
          success: false,
          error: 'Failed to insert grammar',
          message: grammarRpc.error.message
        });
      }

      const grammarData = Array.isArray(grammarRpc.data) ? grammarRpc.data[0] : null;
      grammarEntityIds = grammarData?.entity_ids ?? [];

      if (!grammarData || !Array.isArray(grammarEntityIds)) {
        return res.status(500).json({
          success: false,
          error: 'Unexpected grammar RPC response shape'
        });
      }
    }

    // 5) Build 2D array for create_relations_from_set_group_v3
    const relationsArray: Array<[string, string]> = [];
    let vocabIndex = 0;
    let grammarIndex = 0;

    for (const mapping of itemTypeMap) {
      if (mapping.type === 'vocab') {
        const entityId = vocabEntityIds[vocabIndex];
        if (entityId) {
          relationsArray.push(['vocab', entityId]);
        }
        vocabIndex++;
      } else if (mapping.type === 'grammar') {
        const entityId = grammarEntityIds[grammarIndex];
        if (entityId) {
          relationsArray.push(['grammar', entityId]);
        }
        grammarIndex++;
      }
    }

    // 6) Create relations using the v3 function
    const relationRpc = await supabaseKvs
      .rpc('create_relations_from_set_group_v3', {
        eid_set: setEntityId,
        items: relationsArray
      });

    if (relationRpc.error) {
      (req as any).log?.error('rpc.failed', { fn: 'create_relations_from_set_group_v3', error: relationRpc.error.message, code: relationRpc.error.code });
      return res.status(500).json({
        success: false,
        error: 'Failed to create relations',
        message: relationRpc.error.message
      });
    }

    // Fire-and-forget: auto-categorize uncategorized vocab items after response
    const uncategorizedVocab = vocabItems
      .map((item, i) => ({ item, entityId: vocabEntityIds[i] }))
      .filter(({ item, entityId }) => entityId && (!item.lexical_category || item.lexical_category.trim() === ''));

    if (uncategorizedVocab.length > 0) {
      (async () => {
        try {
          for (const { item, entityId } of uncategorizedVocab) {
            const result = await categorizeWord(item.kana, item.kanji);
            if (result && result.lexical_category) {
              await supabaseKvs
                .rpc('update_vocab_entity_by_id', {
                  entity_uuid: entityId,
                  json_updates: JSON.stringify({ lexical_category: result.lexical_category }),
                });
            }
          }
          // Mark set as auto-categorized
          await supabaseKvs
            .rpc('update_set_by_id', {
              entity_uuid: setEntityId,
              json_updates: JSON.stringify({ auto_categorized: 'true' }),
            });
        } catch (catError) {
          (req as any).log?.error('autocategorize.failed', { error: catError instanceof Error ? catError.message : String(catError), stack: catError instanceof Error ? catError.stack : undefined });
        }
      })();
    }

    return res.status(201).json({
      success: true,
      data: {
        success: true,
        set_result: {
          inserted_count: setData.inserted_count ?? null,
          transaction_id: setData.transaction_id ?? null,
          entity_id: setEntityId
        },
        vocabulary_result: {
          inserted_count: vocabItems.length,
          entity_ids: vocabEntityIds
        },
        grammar_result: {
          inserted_count: grammarItems.length,
          entity_ids: grammarEntityIds
        },
        relations_created: true,
        relation_entity_ids: relationRpc.data ?? [],
        total_items: relationsArray.length,
        relations_array: relationsArray
      },
      message: 'Set created successfully'
    });

  } catch (error) {
    (req as any).log?.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });

    // Generic error handler
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export function required by Pages Router
// Protected with withAuth — requires valid session
export default withAuth(async function handler(req: AuthedRequest, res: NextApiResponse) {
  if (!limiter.check(req.auth0Sub)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  const { method } = req;

  switch (method) {
    case 'POST': {
      // Enforce 1000-set account cap
      const userId = req.userId;
      const { data: setCount } = await supabaseKvs
        .rpc('get_user_set_count', { p_user_id: userId });
      if ((setCount ?? 0) >= 1000) {
        return res.status(403).json({
          success: false,
          error: 'Account set limit reached (1000 sets maximum)'
        });
      }
      return handlePOST(req, res, userId);
    }

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
})