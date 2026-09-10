import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthorizationUrl, createPkceTransaction, exchangeAuthorizationCode } from '../src/oauth.mjs';

test('creates a valid PKCE transaction', () => {
  const transaction = createPkceTransaction(123);
  assert.equal(transaction.createdAt, 123);
  assert.match(transaction.verifier, /^[A-Za-z0-9_-]{43,128}$/);
  assert.match(transaction.challenge, /^[A-Za-z0-9_-]{43}$/);
  assert.match(transaction.state, /^[A-Za-z0-9_-]+$/);
});

test('builds a Yahoo authorization URL without a client secret', () => {
  const url = buildAuthorizationUrl({
    clientId: 'synthetic-client-id',
    redirectUri: 'https://localhost:8787/oauth/callback',
    transaction: { challenge: 'synthetic-challenge', state: 'synthetic-state' },
  });
  assert.equal(url.hostname, 'api.login.yahoo.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('state'), 'synthetic-state');
  assert.equal(url.searchParams.has('client_secret'), false);
});

test('exchanges a code as a public client with PKCE', async () => {
  let captured;
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({ access_token: 'synthetic-token' }) };
  };
  const result = await exchangeAuthorizationCode({
    clientId: 'synthetic-client-id',
    redirectUri: 'https://localhost:8787/oauth/callback',
    code: 'synthetic-code',
    verifier: 'synthetic-verifier',
    fetchImpl,
  });
  assert.equal(result.access_token, 'synthetic-token');
  assert.equal(captured.options.body.get('code_verifier'), 'synthetic-verifier');
  assert.equal(captured.options.body.has('client_secret'), false);
});
