# Personal Fantasy Football Draft Assistant

A personal, locally hosted fantasy football draft assistant for analyzing the owner's own fantasy league and team information.

## Project status

This project is under development. It is intended for a single user's personal, non-commercial use and is not distributed through an app store or offered as a public service.

## Data sources and use

The application is designed to retrieve authorized, read-only fantasy information for the owner's own leagues and teams. It does not provide account registration, shared access, public league views, commercial services, or Yahoo account write operations.

Fantasy data provided by [Yahoo Fantasy](https://sports.yahoo.com/fantasy/).

This independent project is not affiliated with or endorsed by Yahoo.

## Privacy and security

OAuth credentials and tokens must remain on the owner's local machine and must never be committed to this repository. Real fantasy data, API responses, logs containing Yahoo data, exports, caches, databases, and screenshots containing private league information are also excluded.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Development policy

Development and automated tests must use synthetic fixtures. Real Yahoo Fantasy information must not be included in issues, commits, test fixtures, AI prompts, telemetry, or hosted services.

## Local OAuth development

The initial implementation uses Yahoo's Authorization Code flow with PKCE as a public client. OAuth tokens are kept in application memory and are not logged or persisted.

Requirements:

- Node.js 20 or newer
- A locally trusted HTTPS certificate for `localhost`
- A `.env` file created from `.env.example`

Run the synthetic unit tests with `npm test`. Once the local certificate files are configured, start the application with `npm start` and open `https://localhost:8787`.
