import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { resolveUserId } from '@/lib/resolveUserId';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ApiResponse {
  success: boolean;
  setEntityId?: string;
  error?: string;
  message?: string;
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  if (!limiter.check(session.user.sub)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { shareToken } = req.body;

    if (!shareToken || typeof shareToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid shareToken'
      });
    }

    // Fetch the shared set
    const { data, error: fetchError } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_by_share_token', { token: shareToken.trim() });

    if (fetchError || !data) {
      return res.status(404).json({
        success: false,
        error: 'Shared set not found or link has been revoked'
      });
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const sourceSet = parsed.set;
    const sourceItems = parsed.items || [];
    const sourceEntityId = parsed.entity_id;

    if (sourceItems.length > 17000) {
      return res.status(400).json({
        success: false,
        error: 'Import exceeds the maximum of 17000 items per set'
      });
    }

    if (!sourceSet) {
      return res.status(500).json({
        success: false,
        error: 'Invalid set data from share link'
      });
    }

    const userId = await resolveUserId(session.user.sub);

    // Enforce 1000-set account cap
    const { data: setCount } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_set_count', { p_user_id: userId });
    if ((setCount ?? 0) >= 1000) {
      return res.status(403).json({
        success: false,
        error: 'Account set limit reached (1000 sets maximum)'
      });
    }

    const now = new Date().toISOString();

    // Check for duplicate import — has this user already imported this set?
    if (sourceEntityId) {
      const { data: dupData } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('check_duplicate_import', {
          p_user_id: userId,
          p_source_entity_id: sourceEntityId
        });

      const dupResult = typeof dupData === 'string' ? JSON.parse(dupData) : dupData;
      if (dupResult?.existing_set_entity_id) {
        return res.status(409).json({
          success: false,
          error: 'You have already imported this set',
          setEntityId: dupResult.existing_set_entity_id
        });
      }
    }

    // 1) Create the new set (owned by current user, SRS disabled, no share_token)
    const newSet: Record<string, any> = {
      owner: userId,
      title: sourceSet.title || 'Imported Set',
      description: sourceSet.description || '',
      date_created: now,
      updated_at: now,
      last_studied: '',
      tags: sourceSet.tags || '[]',
      srs_enabled: 'false',
      set_type: sourceSet.set_type || null,
      item_num: sourceItems.length,
      share_token: '',
    };

    // Track import source for lineage
    if (sourceEntityId) {
      newSet.imported_from = sourceEntityId;
    }

    const setRpc = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('insert_json_to_set', {
        json_array_input: JSON.stringify([newSet])
      });

    if (setRpc.error) {
      console.error('Failed to create imported set:', setRpc.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create imported set'
      });
    }

    const setResult = Array.isArray(setRpc.data) ? setRpc.data[0] : null;
    const newSetEntityId = setResult?.entity_ids?.[0];

    if (!newSetEntityId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get new set entity ID'
      });
    }

    // 2) Separate items by type and insert
    const vocabItems: any[] = [];
    const grammarItems: any[] = [];
    const itemTypeMap: Array<{ index: number; type: string }> = [];

    for (let i = 0; i < sourceItems.length; i++) {
      const item = sourceItems[i];
      const type = item.type;
      itemTypeMap.push({ index: i, type });

      if (type === 'vocab') {
        vocabItems.push({
          type: 'vocab',
          owner: userId,
          known_status: 'unknown',
          srs_level: 0,
          srs_reviewed_last: null,
          english: item.english || '',
          kana: item.kana || '',
          kanji: item.kanji || '',
          lexical_category: item.lexical_category || '',
          example_sentences: item.example_sentences || '',
          tags: item.tags || [],
          audio: item.audio || ''
        });
      } else if (type === 'grammar') {
        grammarItems.push({
          type: 'grammar',
          owner: userId,
          known_status: 'unknown',
          srs_level: 0,
          srs_reviewed_last: null,
          title: item.title || '',
          description: item.description || '',
          topic: item.topic || '',
          notes: item.notes || '',
          example_sentences: item.example_sentences || [],
          tags: item.tags || [],
          audio: item.audio || ''
        });
      }
    }

    let vocabEntityIds: string[] = [];
    if (vocabItems.length > 0) {
      const vocabRpc = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('insert_json_to_kb_vocab', {
          json_array_input: JSON.stringify(vocabItems)
        });

      if (vocabRpc.error) {
        console.error('Failed to insert vocab:', vocabRpc.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to import vocabulary items'
        });
      }

      const vocabData = Array.isArray(vocabRpc.data) ? vocabRpc.data[0] : null;
      vocabEntityIds = vocabData?.entity_ids ?? [];
    }

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
          error: 'Failed to import grammar items'
        });
      }

      const grammarData = Array.isArray(grammarRpc.data) ? grammarRpc.data[0] : null;
      grammarEntityIds = grammarData?.entity_ids ?? [];
    }

    // 3) Build relations array and create relations
    const relationsArray: Array<[string, string]> = [];
    let vocabIndex = 0;
    let grammarIndex = 0;

    for (const mapping of itemTypeMap) {
      if (mapping.type === 'vocab') {
        const entityId = vocabEntityIds[vocabIndex];
        if (entityId) relationsArray.push(['vocab', entityId]);
        vocabIndex++;
      } else if (mapping.type === 'grammar') {
        const entityId = grammarEntityIds[grammarIndex];
        if (entityId) relationsArray.push(['grammar', entityId]);
        grammarIndex++;
      }
    }

    if (relationsArray.length > 0) {
      const relationRpc = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('create_relations_from_set_group_v3', {
          eid_set: newSetEntityId,
          items: relationsArray
        });

      if (relationRpc.error) {
        console.error('Failed to create relations:', relationRpc.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to link items to imported set'
        });
      }
    }

    return res.status(201).json({
      success: true,
      setEntityId: newSetEntityId,
      message: `Set imported successfully with ${relationsArray.length} items`
    });

  } catch (error) {
    console.error('Import API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
