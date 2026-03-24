import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import crypto from 'crypto';
import { toSlug } from '@/lib/slug';
import { supabaseKvs } from '@/lib/supabaseKvs';

const EXPIRY_OPTIONS: Record<string, number | null> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  'never': null,
};

const SHORT_TOKEN_LENGTH = 7;
const SHORT_TOKEN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const MAX_TOKEN_RETRIES = 5;

export function generateShortToken(): string {
  const bytes = crypto.randomBytes(SHORT_TOKEN_LENGTH);
  let token = '';
  for (let i = 0; i < SHORT_TOKEN_LENGTH; i++) {
    token += SHORT_TOKEN_CHARS[bytes[i] % SHORT_TOKEN_CHARS.length];
  }
  return token;
}

function buildShareUrl(baseUrl: string, token: string, title?: string): string {
  const slug = toSlug(title || 'set');
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/shared/sets/${token}/${slug}`;
}

interface ApiResponse {
  success: boolean;
  shareToken?: string | null;
  shareUrl?: string | null;
  expiresAt?: string | null;
  error?: string;
  message?: string;
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
) {
  const userId = req.userId;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { setId, action, expiresIn } = req.body;

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

    // Validate expiresIn if provided
    if (expiresIn && !EXPIRY_OPTIONS.hasOwnProperty(expiresIn)) {
      return res.status(400).json({
        success: false,
        error: "expiresIn must be '1d', '7d', '30d', or 'never'"
      });
    }

    // Verify the user owns this set
    const { data: setData, error: setError } = await supabaseKvs
      .rpc('get_set_with_items_v2', { set_entity_id: setId });

    if (setError || !setData) {
      return res.status(404).json({
        success: false,
        error: 'Set not found'
      });
    }

    const parsed = typeof setData === 'string' ? JSON.parse(setData) : setData;
    if (parsed?.set?.owner !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this set'
      });
    }

    const setTitle = parsed?.set?.title;

    if (action === 'revoke') {
      await supabaseKvs
        .rpc('update_set_by_id', {
          entity_uuid: setId,
          json_updates: JSON.stringify({ share_token: '', share_expires_at: '' })
        });

      return res.status(200).json({
        success: true,
        shareToken: null,
        shareUrl: null,
        expiresAt: null,
        message: 'Share link revoked'
      });
    }

    // action === 'generate'
    // Check if a share_token already exists for this set (via RPC, not direct table query)
    const { data: tokenData } = await supabaseKvs
      .rpc('get_share_token_for_set', { set_entity_id: setId });

    const tokenResult = typeof tokenData === 'string' ? JSON.parse(tokenData) : tokenData;
    const existingToken = tokenResult?.share_token;

    if (existingToken) {
      // Token already exists — return it
      const baseUrl = process.env.AUTH0_BASE_URL || 'https://rebabel.app';
      return res.status(200).json({
        success: true,
        shareToken: existingToken,
        shareUrl: buildShareUrl(baseUrl, existingToken, setTitle),
        message: 'Existing share link returned'
      });
    }

    // Generate new short token with collision check
    let shareToken = '';
    for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
      const candidate = generateShortToken();
      const { data: collision } = await supabaseKvs
        .rpc('get_set_by_share_token', { token: candidate });
      if (!collision) {
        shareToken = candidate;
        break;
      }
      // If data came back as an empty/null parsed result, no collision
      const collisionParsed = typeof collision === 'string' ? JSON.parse(collision) : collision;
      if (!collisionParsed || !collisionParsed.set) {
        shareToken = candidate;
        break;
      }
    }

    if (!shareToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique share token. Please try again.'
      });
    }

    // Compute expiration
    const expiryDays = EXPIRY_OPTIONS[expiresIn || 'never'];
    let expiresAtStr = '';
    if (expiryDays !== null && expiryDays !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      expiresAtStr = expiresAt.toISOString();
    }

    const { error: updateError } = await supabaseKvs
      .rpc('update_set_by_id', {
        entity_uuid: setId,
        json_updates: JSON.stringify({
          share_token: shareToken,
          share_expires_at: expiresAtStr
        })
      });

    if (updateError) {
      req.log.error('rpc.failed', { fn: 'update_set_by_id', error: updateError.message, code: updateError.code });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate share link'
      });
    }

    const baseUrl = process.env.AUTH0_BASE_URL || 'https://rebabel.app';
    return res.status(200).json({
      success: true,
      shareToken,
      shareUrl: buildShareUrl(baseUrl, shareToken, setTitle),
      expiresAt: expiresAtStr || null,
      message: 'Share link generated'
    });

  } catch (error) {
    req.log.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
