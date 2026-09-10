import fs from 'node:fs';
import https from 'node:https';
import { getConfig } from './config.mjs';
import { buildAuthorizationUrl, createPkceTransaction, exchangeAuthorizationCode } from './oauth.mjs';

const config = getConfig();
const transactions = new Map();
let tokenState = null;

function html(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:16px/1.5 system-ui;max-width:46rem;margin:4rem auto;padding:0 1rem}a,button{font:inherit}footer{border-top:1px solid #aaa;margin-top:3rem;padding-top:1rem;font-size:.9rem}</style></head><body><main>${content}</main><footer>Fantasy data provided by <a href="https://sports.yahoo.com/fantasy/">Yahoo Fantasy</a>. This independent project is not affiliated with or endorsed by Yahoo.</footer></body></html>`;
}

function send(response, status, body, contentType = 'text/html; charset=utf-8') {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    'content-type': contentType,
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
  response.end(body);
}

function removeExpiredTransactions(now = Date.now()) {
  for (const [state, transaction] of transactions) {
    if (now - transaction.createdAt > 10 * 60 * 1000) transactions.delete(state);
  }
}

const server = https.createServer({
  cert: fs.readFileSync(config.tlsCertPath),
  key: fs.readFileSync(config.tlsKeyPath),
}, async (request, response) => {
  const url = new URL(request.url, config.redirectUri);

  if (request.method === 'GET' && url.pathname === '/') {
    return send(response, 200, html('Fantasy Draft Assistant', `<h1>Personal Fantasy Football Draft Assistant</h1><p>${tokenState ? 'Yahoo authorization is active for this session.' : 'Yahoo authorization has not been completed.'}</p><p><a href="/auth/start">Authorize with Yahoo</a></p>`));
  }

  if (request.method === 'GET' && url.pathname === '/auth/start') {
    removeExpiredTransactions();
    const transaction = createPkceTransaction();
    transactions.set(transaction.state, transaction);
    response.writeHead(302, {
      'cache-control': 'no-store',
      location: buildAuthorizationUrl({ clientId: config.clientId, redirectUri: config.redirectUri, transaction }),
    });
    return response.end();
  }

  if (request.method === 'GET' && url.pathname === '/oauth/callback') {
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const oauthError = url.searchParams.get('error');
    const transaction = state ? transactions.get(state) : null;
    if (state) transactions.delete(state);

    if (oauthError) return send(response, 400, html('Authorization declined', '<h1>Authorization was not completed</h1><p>You may close this page and try again.</p>'));
    if (!state || !code || !transaction || Date.now() - transaction.createdAt > 10 * 60 * 1000) {
      return send(response, 400, html('Invalid callback', '<h1>Invalid or expired authorization response</h1><p>Return to the application and start again.</p>'));
    }

    try {
      tokenState = await exchangeAuthorizationCode({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        code,
        verifier: transaction.verifier,
      });
      return send(response, 200, html('Authorization complete', '<h1>Authorization complete</h1><p>The credentials are held only in application memory and were not logged or written to disk.</p><p><a href="/">Return home</a></p>'));
    } catch (error) {
      return send(response, 502, html('Authorization failed', `<h1>Authorization failed</h1><p>${String(error.message).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`));
    }
  }

  return send(response, 404, html('Not found', '<h1>Not found</h1>'));
});

server.listen(config.port, '127.0.0.1', () => {
  console.log(`Local application ready at https://localhost:${config.port}`);
  console.log('OAuth tokens and Yahoo responses are never logged.');
});
