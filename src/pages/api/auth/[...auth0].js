import {
  handleAuth,
  handleLogin,
  handleLogout,
  handleCallback,
} from '@auth0/nextjs-auth0';
import { notifySlackSignup } from '@/lib/webhooks/slack';
import { resolveUserId } from '@/lib/resolveUserId';

export default handleAuth({
  async login(req, res) {
    await handleLogin(req, res, {
      returnTo: '/learn/dashboard',
    });
  },
  async logout(req, res) {
    await handleLogout(req, res, {
      returnTo: '/learn/dashboard',
    });
  },
  async callback(req, res) {
    await handleCallback(req, res, {
      afterCallback: async (_req, _res, session) => {
        // Auto-provision ReBabel user identity on every login
        if (session.user?.sub) {
          await resolveUserId(session.user.sub, session.user.email);
        }
        // Auth0 sets logins_count on the user profile — 1 means first login (new sign-up)
        if (session.user?.logins_count === 1) {
          notifySlackSignup({
            userId: session.user.sub,
            email: session.user.email,
            name: session.user.name,
          });
        }
        return session;
      },
    });
  },
});
