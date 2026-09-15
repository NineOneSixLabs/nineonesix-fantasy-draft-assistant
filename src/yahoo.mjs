const FANTASY_API_CHECK_URL =
  'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games?format=json';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function verifyFantasyAccess({ accessToken, fetchImpl = fetch, waitImpl = wait }) {
  if (!accessToken) throw new Error('An access token is required');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchImpl(FANTASY_API_CHECK_URL, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.ok) {
      // Deliberately discard the response instead of storing, caching, indexing,
      // logging, or returning Yahoo Fantasy information.
      await response.arrayBuffer();
      return true;
    }

    if (!RETRYABLE_STATUS.has(response.status) || attempt === 2) {
      throw new Error(`Yahoo Fantasy API access check failed (${response.status})`);
    }

    await response.arrayBuffer().catch(() => undefined);
    const retryAfter = Number.parseInt(response.headers.get('retry-after') ?? '', 10);
    const delay = Number.isFinite(retryAfter)
      ? Math.min(retryAfter * 1000, 10_000)
      : 500 * (2 ** attempt);
    await waitImpl(delay);
  }

  return false;
}
