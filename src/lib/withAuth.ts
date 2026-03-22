/**
 * Unified auth + logging middleware for API routes.
 * Combines withApiAuthRequired, withLogger, getSession, and resolveUserId
 * into a single wrapper.
 *
 * Usage:
 *   // Standard authenticated route (resolves usr_ ID):
 *   export default withAuth(async (req, res) => {
 *     req.userId;    // 'usr_...' (ReBabel ID)
 *     req.auth0Sub;  // 'auth0|...' (Auth0 ID)
 *     req.log;       // structured logger with requestId, route, userId
 *   });
 *
 *   // Admin route:
 *   export default withAuth(async (req, res) => {
 *     // ...
 *   }, { requireAdmin: true });
 *
 *   // Route that only needs Auth0 session (no resolveUserId):
 *   export default withAuth(async (req, res) => {
 *     req.auth0Sub;  // available
 *     req.userId;    // still resolved by default
 *   });
 */

import type { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { withLogger } from './withLogger';
import { resolveUserId } from './resolveUserId';
import type { LoggedRequest } from './withLogger';

export interface AuthedRequest extends LoggedRequest {
  userId: string;    // ReBabel usr_ ID
  auth0Sub: string;  // Auth0 subject ID
  auth0Email: string; // Auth0 user email
  isAdmin: boolean;
}

interface WithAuthOptions {
  requireAdmin?: boolean;
}

type AuthedHandler = (
  req: AuthedRequest,
  res: NextApiResponse
) => Promise<void> | void;

export function withAuth(handler: AuthedHandler, options?: WithAuthOptions) {
  return withApiAuthRequired(
    withLogger(async function authedHandler(req, res) {
      const session = await getSession(req, res);

      if (!session?.user?.sub) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const authed = req as unknown as AuthedRequest;
      authed.auth0Sub = session.user.sub;
      authed.auth0Email = session.user.email || '';

      // Check admin if required
      const isAdmin =
        (session.user as any)['https://rebabel.org/app_metadata']?.isAdmin ||
        false;
      authed.isAdmin = isAdmin;

      if (options?.requireAdmin && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden — admin access required' });
      }

      // Resolve ReBabel user ID
      const userId = await resolveUserId(session.user.sub, session.user.email);
      authed.userId = userId;

      // Enrich logger with user context
      authed.log = authed.log.child({ userId, auth0Sub: session.user.sub });

      await handler(authed, res);
    })
  );
}
