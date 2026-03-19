import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ApiResponse {
  success: boolean;
  shareToken?: string | null;
  shareUrl?: string | null;
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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { setId, action } = req.body;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid setId'
      });
    }

    if (action !== 'generate' && action !== 'revoke') {
      return res.status(400).json({
        success: false,
        error: "action must be 'generate' or 'revoke'"
      });
    }

    // Verify the user owns this set
    const { data: setData, error: setError } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_with_items_v2', { set_entity_id: setId });

    if (setError || !setData) {
      return res.status(404).json({
        success: false,
        error: 'Set not found'
      });
    }

    const parsed = typeof setData === 'string' ? JSON.parse(setData) : setData;
    if (parsed?.set?.owner !== session.user.sub) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this set'
      });
    }

    if (action === 'revoke') {
      // Set share_token to empty string to effectively remove it
      await supabase
        .schema('v1_kvs_rebabel')
        .rpc('update_set_by_id', {
          entity_uuid: setId,
          json_updates: JSON.stringify({ share_token: '' })
        });

      return res.status(200).json({
        success: true,
        shareToken: null,
        shareUrl: null,
        message: 'Share link revoked'
      });
    }

    // action === 'generate'
    // Check if a share_token already exists for this set (via RPC, not direct table query)
    const { data: tokenData } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_share_token_for_set', { set_entity_id: setId });

    const tokenResult = typeof tokenData === 'string' ? JSON.parse(tokenData) : tokenData;
    const existingToken = tokenResult?.share_token;

    if (existingToken) {
      // Token already exists — return it
      const baseUrl = process.env.AUTH0_BASE_URL || 'https://rebabel.app';
      return res.status(200).json({
        success: true,
        shareToken: existingToken,
        shareUrl: `${baseUrl}/shared/sets/${existingToken}`,
        message: 'Existing share link returned'
      });
    }

    // Generate new token
    const shareToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('update_set_by_id', {
        entity_uuid: setId,
        json_updates: JSON.stringify({ share_token: shareToken })
      });

    if (updateError) {
      console.error('Failed to save share token:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate share link'
      });
    }

    const baseUrl = process.env.AUTH0_BASE_URL || 'https://rebabel.app';
    return res.status(200).json({
      success: true,
      shareToken,
      shareUrl: `${baseUrl}/shared/sets/${shareToken}`,
      message: 'Share link generated'
    });

  } catch (error) {
    console.error('Share API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
