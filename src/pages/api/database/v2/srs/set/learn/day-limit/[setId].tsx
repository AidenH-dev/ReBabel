import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DayLimitResponse {
  set_eid: string;
  p_learn_new_limit: number;
  learned_count: number;
  learn_new_left: number;
}

interface ApiResponse {
  success: boolean;
  data?: DayLimitResponse;
  error?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { setId } = req.query;
    const { limit, vocab_or_grammer, as_of, as_of_timezone } = req.query;

    // Validate setId parameter
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    // Validate limit parameter
    if (!limit) {
      return res.status(400).json({
        success: false,
        error: 'Missing limit parameter'
      });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter - must be a positive integer'
      });
    }

    // Validate vocab_or_grammer parameter
    const vocabOrGrammar = (vocab_or_grammer as string) || 'VOCAB';
    if (!['VOCAB', 'GRAMMAR'].includes(vocabOrGrammar)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vocab_or_grammer parameter - must be VOCAB or GRAMMAR'
      });
    }

    // Set default as_of to current timestamp if not provided
    let asOfTimestamp = as_of as string;
    if (!asOfTimestamp) {
      asOfTimestamp = new Date().toISOString();
    }

    // Validate as_of is a valid timestamp
    const asOfDate = new Date(asOfTimestamp);
    if (isNaN(asOfDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid as_of parameter - must be a valid ISO timestamp'
      });
    }

    // Set default timezone if not provided
    const timezone = (as_of_timezone as string) || 'UTC';

    // Call the Supabase RPC function
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_items_left_count', {
        args: {
          set_eid: setId,
          learn_new_limit: limitNum,
          vocab_or_grammar: vocabOrGrammar,
          as_of: asOfTimestamp,
          as_of_timezone: timezone
        }
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No data returned from database'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res);
})
