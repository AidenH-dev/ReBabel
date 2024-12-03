export default function signup(req, res) {
    const signupUrl = `https://${process.env.AUTH0_DOMAIN}/authorize?` +
      new URLSearchParams({
        client_id: process.env.AUTH0_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.AUTH0_REDIRECT_URI, // Your callback URL
        scope: 'openid profile email',
        screen_hint: 'signup',
      }).toString();
  
    res.redirect(signupUrl);
  }
  