// Sign in with Google (OAuth 2.0 authorization code flow), no SDK.
// Dormant unless GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set — the UI
// hides the button when this returns false.
import { appUrl } from './email.js';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${appUrl()}/api/auth/google/callback`;
}

export function googleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return `${AUTH_ENDPOINT}?${params}`;
}

/** Swap the one-time code for the signed-in person's email and name. */
export async function exchangeGoogleCode(code) {
  if (!code) throw new Error('Missing authorization code');
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code'
    })
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(token?.error_description || `Google token exchange failed (${tokenRes.status})`);

  const userRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  const profile = await userRes.json();
  if (!userRes.ok) throw new Error(profile?.error?.message || `Google userinfo failed (${userRes.status})`);
  if (profile.email_verified === false) throw new Error('That Google account has an unverified email');
  return { email: profile.email, name: profile.name };
}
