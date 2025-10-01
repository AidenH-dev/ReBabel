//import { initAuth0 } from '@auth0/nextjs-auth0';
//
//const auth0 = initAuth0({
//  secret: process.env.AUTH0_SECRET,
//  baseURL: process.env.AUTH0_BASE_URL,
//  clientID: process.env.AUTH0_CLIENT_ID,
//  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
//  authorizationParams: {
//    redirect_uri: process.env.AUTH0_REDIRECT_URI,
//  },
//  session: {
//    rolling: true,
//    rollingDuration: 86400, // 1 day (in seconds)
//    absoluteDuration: 604800, // 1 week (in seconds)
//    cookie: {
//      domain: process.env.AUTH0_COOKIE_DOMAIN || 'localhost', // Match your domain
//      path: '/',
//      httpOnly: true,
//      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
//      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin
//    },
//  },
//});
//
//export default auth0.handleAuth({
//  async login(req, res) {
//    try {
//      console.log('Before login cookies:', req.cookies);
//      await auth0.handleLogin(req, res, {
//        returnTo: '/learn',
//      });
//      console.log('Login response headers:', res.getHeaders()['set-cookie']);
//    } catch (error) {
//      console.error('Error during login:', error);
//      res.status(error.status || 500).end(error.message);
//    }
//  },
//
//  async callback(req, res) {
//    try {
//      console.log('Callback query:', req.query);
//      console.log('Callback cookies:', req.cookies);
//
//      await auth0.handleCallback(req, res, {
//        redirectTo: '/dashboard',
//      });
//    } catch (error) {
//      console.error('Error during callback:', error);
//      res.status(error.status || 500).end(error.message);
//    }
//  },
//});

import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export default handleAuth({
  async login(req, res) {
    await handleLogin(req, res, {
      returnTo: '/learn/dashboard', // This specifies where to redirect after login
    });
  },
});
