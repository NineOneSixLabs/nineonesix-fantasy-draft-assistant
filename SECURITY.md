# Security Policy

## Sensitive information

Do not commit or submit any of the following:

- Yahoo client secrets, access tokens, refresh tokens, or authorization codes
- `.env` files or local credential stores
- Real API responses or private league and team information
- Logs, screenshots, databases, caches, or exports containing Yahoo Fantasy information

## Reporting a problem

Use a private contact method when reporting an issue that could expose credentials or private fantasy information. Do not place sensitive information in a public GitHub issue.

If a credential is exposed, revoke or rotate it immediately. A suspected incident involving Yahoo materials should be assessed promptly so any required notification can occur within the applicable deadline.

## Development

Use synthetic fixtures for tests, demonstrations, screenshots, and bug reports. Dependencies should be kept current, and the application should use bounded retries and exponential backoff when handling API limits or transient failures.

