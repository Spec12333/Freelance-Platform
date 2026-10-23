const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { env } = require('./config/env');
const { openapiSpec } = require('./config/openapi');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { ApiError } = require('./utils/ApiError');

const app = express();

// Browsers send the literal string "null" as the Origin of file:// pages and
// sandboxed frames, which is not a parseable URL.
const isSameHost = (origin, host) => {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

app.use(
  // The per-request form of cors() is used because the decision needs the
  // request itself, not only its Origin header.
  cors((req, callback) => {
    const origin = req.header('Origin');
    // Allowed without an Origin header (curl, Postman, server-to-server): CORS
    // protects browsers, and those tools send no origin at all.
    // Allowed from this server's own host: Swagger UI at /api/docs is served
    // from here, and browsers attach an Origin header to its POST requests too.
    if (!origin || env.clientUrls.includes(origin) || isSameHost(origin, req.get('host'))) {
      return callback(null, { origin: true });
    }
    callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS`));
  }),
);

app.use(express.json());
// 'dev' is the short colored log for local work; 'combined' is the standard
// format hosting platforms expect to collect.
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Liveness probe. The hosting platform pings it, and it is the cheapest way to
// wake a sleeping free instance before a demo.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
});

// Interactive API reference. persistAuthorization keeps the pasted token across
// page reloads, so you do not have to log in again after every refresh.
app.get('/api/openapi.json', (req, res) => res.json(openapiSpec));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'FreelanceHub API',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  }),
);

app.use('/api', routes);

// Unknown path: turn it into an ApiError so a typo in a URL produces the same
// { message } shape as every other error instead of Express's HTML page.
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
});

// Must stay last: Express only treats it as an error handler after the routes.
app.use(errorHandler);

module.exports = { app };
