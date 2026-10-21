const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { env } = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { ApiError } = require('./utils/ApiError');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, Postman, server-to-server) are
      // allowed: CORS protects browsers, and those tools send no origin at all.
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS`));
    },
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

app.use('/api', routes);

// Unknown path: turn it into an ApiError so a typo in a URL produces the same
// { message } shape as every other error instead of Express's HTML page.
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
});

// Must stay last: Express only treats it as an error handler after the routes.
app.use(errorHandler);

module.exports = { app };
