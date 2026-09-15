import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyFantasyAccess } from '../src/yahoo.mjs';

function response(status) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

test('confirms a successful read-only Fantasy API request', async () => {
  let request;
  const result = await verifyFantasyAccess({
    accessToken: 'synthetic-token',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response(200);
    },
  });

  assert.equal(result, true);
  assert.equal(request.options.headers.authorization, 'Bearer synthetic-token');
  assert.match(request.url, /users;use_login=1\/games/);
});

test('retries a rate limit response with bounded backoff', async () => {
  let attempts = 0;
  const waits = [];
  const result = await verifyFantasyAccess({
    accessToken: 'synthetic-token',
    fetchImpl: async () => response(++attempts === 1 ? 429 : 200),
    waitImpl: async (delay) => waits.push(delay),
  });

  assert.equal(result, true);
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [500]);
});

test('does not retry an authorization failure', async () => {
  let attempts = 0;
  await assert.rejects(
    verifyFantasyAccess({
      accessToken: 'synthetic-token',
      fetchImpl: async () => {
        attempts += 1;
        return response(403);
      },
    }),
    /failed \(403\)/,
  );
  assert.equal(attempts, 1);
});
