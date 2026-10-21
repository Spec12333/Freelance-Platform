// Loads and validates environment variables once at startup so the rest of the
// app requires a plain object instead of reaching into process.env everywhere.
require('dotenv').config();

const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_SECRET'];

const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Fail fast. A missing secret must stop the process now, not turn into a
  // confusing 500 on the first request that needs it.
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  // The hosting platform assigns the port, so an own default is only for local runs.
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // CLIENT_URL is a comma-separated list: the production domain plus preview
  // deploys, which get their own URL on every push.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
};

module.exports = { env };
