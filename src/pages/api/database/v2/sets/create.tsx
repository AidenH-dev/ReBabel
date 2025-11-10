import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

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

async function handlePOST(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
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

    // 1) Insert set
    const setRpc = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('insert_json_to_set', {
        json_array_input: JSON.stringify([updatedSet])
      });

    if (setRpc.error) {
      console.error('Failed to insert set:', setRpc.error);
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
      const vocabRpc = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('insert_json_to_kb_vocab', {
          json_array_input: JSON.stringify(vocabItems)
        });

      if (vocabRpc.error) {
        console.error('Failed to insert vocabulary:', vocabRpc.error);
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
      const grammarRpc = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('insert_json_to_kb_grammar', {
          json_array_input: JSON.stringify(grammarItems)
        });

      if (grammarRpc.error) {
        console.error('Failed to insert grammar:', grammarRpc.error);
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
    const relationRpc = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('create_relations_from_set_group_v3', {
        eid_set: setEntityId,
        items: relationsArray
      });

    if (relationRpc.error) {
      console.error('Failed to create relations:', relationRpc.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create relations',
        message: relationRpc.error.message
      });
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
})