import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRateLimiter } from '@/lib/rateLimit';

// Public endpoint — no withApiAuthRequired
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limit: 30 requests per minute per IP
const limiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });

// Fields to strip from items for public preview
const SENSITIVE_ITEM_FIELDS = ['owner', 'srs_level', 'srs_reviewed_last', 'known_status'];
const SENSITIVE_SET_FIELDS = ['owner'];

function stripSensitiveFields(obj: Record<string, any>, fields: string[]) {
  const clean = { ...obj };
  for (const f of fields) {
    delete clean[f];
  }
  return clean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate limit by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  if (!limiter.check(ip)) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid share token'
      });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_by_share_token', { token: token.trim() });

    if (error) {
      console.error('RPC error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Shared set not found or link has been revoked'
      });
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    // Strip sensitive fields
    const cleanSet = stripSensitiveFields(parsed.set || {}, SENSITIVE_SET_FIELDS);
    const cleanItems = (parsed.items || []).map((item: Record<string, any>) =>
      stripSensitiveFields(item, SENSITIVE_ITEM_FIELDS)
    );

    return res.status(200).json({
      success: true,
      data: {
        entity_id: parsed.entity_id,
        set: cleanSet,
        items: cleanItems,
        item_count: cleanItems.length
      }
    });

  } catch (error) {
    console.error('Shared set API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
