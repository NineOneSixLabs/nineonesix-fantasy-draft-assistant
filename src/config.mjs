import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(file = '.env') {
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function getConfig() {
  loadEnv();

  const config = {
    clientId: process.env.YAHOO_CLIENT_ID,
    redirectUri: process.env.YAHOO_REDIRECT_URI ?? 'https://localhost:8787/oauth/callback',
    port: Number.parseInt(process.env.PORT ?? '8787', 10),
    tlsCertPath: path.resolve(process.env.TLS_CERT_PATH ?? 'certs/localhost-cert.pem'),
    tlsKeyPath: path.resolve(process.env.TLS_KEY_PATH ?? 'certs/localhost-key.pem'),
  };

  if (!config.clientId) throw new Error('YAHOO_CLIENT_ID is required in .env');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  const redirect = new URL(config.redirectUri);
  if (redirect.protocol !== 'https:' || redirect.hostname !== 'localhost') {
    throw new Error('YAHOO_REDIRECT_URI must use https://localhost for this local application');
  }

  return config;
}
