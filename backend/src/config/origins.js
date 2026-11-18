const { env } = require('./env');

// Use the same browser origins for REST and WebSocket upgrades.
const isAllowedOrigin = (origin, host) => {
  if (!origin || env.clientUrls.includes(origin)) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    // file:// and sandboxed frames can send the literal origin "null".
    return false;
  }
};

module.exports = { isAllowedOrigin };
