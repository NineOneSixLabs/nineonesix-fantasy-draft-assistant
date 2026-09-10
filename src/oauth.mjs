import crypto from 'node:crypto';

export const AUTHORIZATION_ENDPOINT = 'https://api.login.yahoo.com/oauth2/request_auth';
export const TOKEN_ENDPOINT = 'https://api.login.yahoo.com/oauth2/get_token';

function base64Url(buffer) {
  return buffer.toString('base64url');
}

export function createPkceTransaction(now = Date.now()) {
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());

  return {
    state: base64Url(crypto.randomBytes(32)),
    verifier,
    challenge,
    createdAt: now,
  };
}

export function buildAuthorizationUrl({ clientId, redirectUri, transaction }) {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: transaction.challenge,
    code_challenge_method: 'S256',
  });
  url.searchParams.set('state', transaction.state);
  return url;
}

export async function exchangeAuthorizationCode({ clientId, redirectUri, code, verifier, fetchImpl = fetch }) {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `Yahoo token request failed (${response.status})`);
  }

  return payload;
}
