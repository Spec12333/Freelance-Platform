# Backend Guide

How the FreelanceHub backend works inside, written so that someone who has
never built a backend can follow it.

- **What** endpoints exist and what they return → [`API.md`](API.md) and the
  Swagger UI at <http://localhost:4000/api/docs>
- **Which** tables exist → [`DB.md`](DB.md)
- **How** it all works and why it is built this way → this file

Contents:

1. [The big picture](#1-the-big-picture)
2. [Running it](#2-running-it)
3. [A tour of the folders](#3-a-tour-of-the-folders)
4. [The life of one request](#4-the-life-of-one-request)
5. [Concepts, one at a time](#5-concepts-one-at-a-time)
6. [Where each business rule lives](#6-where-each-business-rule-lives)
7. [Recipe: adding an endpoint](#7-recipe-adding-an-endpoint)
8. [Demo data](#8-demo-data)
9. [Troubleshooting](#9-troubleshooting)
10. [Deploying](#10-deploying)
11. [Known limitations](#11-known-limitations)
12. [Glossary](#12-glossary)

---

## 1. The big picture

The frontend never touches the database. It sends HTTP requests ("give me the
open orders", "accept proposal 2") and the backend decides whether the request is
allowed, does the work in PostgreSQL, and answers with JSON.

```
 Browser (React)                    Backend (Node + Express)                  PostgreSQL
 ───────────────                    ────────────────────────                  ──────────

 axios.post('/api/orders/1/proposals', { price, coverLetter })
        │
        └──────────────────────▶  app.js        cors, JSON parsing, request log
                                     │
                                  routes/       "which code handles this URL?"
                                     │
                                  middleware/   auth → requireRole → validate
                                     │
                                  controllers/  "read the request, send the answer"
                                     │
                                  services/     "the rules"
                                     │
                                  models/       Sequelize ──── SQL ─────▶  tables
                                     │                       ◀── rows ───
        ┌──────────────────────── res.json(proposal)
        ▼
 { id: 16, status: "PENDING", ... }
```

The code is split into **layers**, and each layer has one job:

| Layer | Folder | Its question | It never… |
|---|---|---|---|
| Route | `src/routes/` | Which URL and method? Which checks run first? | contains logic |
| Middleware | `src/middleware/` | Is there a valid token? The right role? A valid body? | knows about orders or proposals |
| Controller | `src/controllers/` | What did the request ask for, and what do we answer? | touches the database |
| Service | `src/services/` | Is this allowed by the business rules? Do it. | sees `req` or `res` |
| Model | `src/models/` | What does a table look like, and how are tables related? | contains rules |

Why bother? Because each question then has exactly one place to look. "Who may
cancel an order?" is in a service. "Is `price` required?" is in a validator.
"Is `/orders/:id/status` behind a login?" is in a route. When something breaks,
you know which file to open.

The stack, in one line each:

| Tool | What it does here |
|---|---|
| **Node.js** | Runs JavaScript outside the browser |
| **Express 5** | Receives HTTP requests and routes them to functions |
| **PostgreSQL** | The database: tables, rows, constraints |
| **Sequelize** | Lets us write `Order.findAll(...)` instead of raw SQL (an "ORM") |
| **Joi** | Checks that incoming data has the right shape |
| **bcrypt** | Turns passwords into hashes that cannot be reversed |
| **jsonwebtoken** | Creates and checks login tokens (JWT) |
| **cors** | Tells browsers which websites may call this API |
| **morgan** | Prints one log line per request |
| **dotenv** | Loads settings from the `.env` file |
| **swagger-ui-express + yaml** | Serves the interactive API docs from `openapi.yaml` |

The backend uses **CommonJS** modules (`require` / `module.exports`), the
original Node.js module system. That is why you will see
`const { Order } = require('../models')` rather than `import`.

---

## 2. Running it

**You need:** Node.js 20 or newer and PostgreSQL 14 or newer running locally.

```bash
cd backend
npm install                          # 1. download dependencies into node_modules/
createdb freelancehub                # 2. create an empty database (or use pgAdmin)
cp .env.example .env                 # 3. create your settings file, then edit it
npm run seed                         # 4. create the tables and fill them with demo data
npm run dev                          # 5. start the server, restarting on every file save
```

Then open:

- <http://localhost:4000/api/health> — should answer `{"status":"ok", ...}`
- <http://localhost:4000/api/docs> — the Swagger UI

### The `.env` file

Settings that differ between your laptop and the production server live in
`backend/.env`. The file is in `.gitignore` and must never be committed, because
it holds secrets. `.env.example` lists every key with a harmless placeholder.

| Key | Example | Meaning |
|---|---|---|
| `NODE_ENV` | `development` | `production` turns on database SSL, short logs, hides error stacks |
| `PORT` | `4000` | The port the server listens on. Hosting platforms set it for you |
| `DATABASE_URL` | `postgres://user:password@localhost:5432/freelancehub` | How to reach the database: user, password, host, port, database name |
| `JWT_SECRET` | 64 random hex characters | The key that signs login tokens. Generate one with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | How long a token stays valid |
| `CLIENT_URL` | `http://localhost:5173` | Websites allowed to call the API from a browser; comma-separated for several |

`src/config/env.js` reads these once at startup. If `DATABASE_URL` or
`JWT_SECRET` is missing, the server refuses to start and tells you which one.
That is deliberate: a clear error at startup beats a mysterious failure on the
first login.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start with **nodemon**: restarts automatically when you save a file |
| `npm start` | Start once, without restarting (what production runs) |
| `npm run seed` | Create missing tables and demo data. Safe to run again: it skips what already exists |
| `npm run seed -- --fresh` | **Delete every table** and recreate the demo data from scratch. Refuses to run when `NODE_ENV=production` |

---

## 3. A tour of the folders

```
backend/
├── .env                     your local settings (not in git)
├── .env.example             the list of settings, with placeholders
├── openapi.yaml             the full API description that Swagger UI displays
├── package.json             dependencies and npm scripts
└── src/
    ├── server.js            entry point: connect to the DB, create tables, start listening
    ├── app.js               builds the Express app: CORS, JSON, logging, docs, routes, errors
    ├── seed.js              fills the database with demo data
    │
    ├── config/
    │   ├── env.js           reads and checks .env
    │   ├── constants.js     the allowed values: roles, order statuses, proposal statuses
    │   └── openapi.js       loads openapi.yaml for Swagger UI
    │
    ├── models/              one file per table, plus index.js that connects them
    │   ├── index.js         the database connection and ALL relations between tables
    │   ├── User.js  Category.js  Order.js  Proposal.js  Review.js  Message.js
    │
    ├── routes/              URL → middleware → controller
    │   ├── index.js         mounts every router under /api
    │   ├── auth.routes.js  categories.routes.js  orders.routes.js  proposals.routes.js
    │   └── freelancers.routes.js  dashboard.routes.js  admin.routes.js
    │
    ├── middleware/          functions that run before a controller
    │   ├── auth.js          checks the token, loads the user, rejects blocked users
    │   ├── requireRole.js   rejects users with the wrong role
    │   ├── validate.js      checks the body / query / params against a Joi schema
    │   └── errorHandler.js  turns every error into a JSON response
    │
    ├── validators/          Joi schemas: what a valid request looks like
    │   ├── common.js        id in the URL, page and limit
    │   └── auth.js  orders.js  proposals.js  messages.js  reviews.js  users.js  admin.js
    │
    ├── controllers/         thin: read the request, call a service, send JSON
    │
    ├── services/            the business logic
    │   ├── orders.service.js      the status machine lives here
    │   ├── proposals.service.js   the accept transaction lives here
    │   ├── query.helpers.js       SQL pieces shared by several services (rating, user shapes)
    │   └── ...one per feature
    │
    └── utils/
        ├── ApiError.js      an error that knows its HTTP status
        ├── asyncHandler.js  forwards async errors to errorHandler
        ├── pagination.js    page/limit → SQL offset, rows → { items, total, page, pages }
        └── slugify.js       "UI/UX Design" → "ui-ux-design"
```

Naming follows a pattern: the orders feature is `routes/orders.routes.js` →
`controllers/orders.controller.js` → `services/orders.service.js`, with its rules
in `validators/orders.js`. Once you know one feature, you know where everything
is in the others.

---

## 4. The life of one request

This is the most useful section to understand. We follow one real request from
the moment it arrives to the moment the answer leaves.

**Anna (a freelancer) sends a proposal for order 2:**

```http
POST /api/orders/2/proposals
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{ "price": 700, "coverLetter": "I built a similar delivery API last year." }
```

### Step 1 — `app.js`: the general-purpose middleware

Every request passes through these in order:

1. **`cors`** checks the `Origin` header — which website the browser says it came
   from. `http://localhost:5173` is on the list, so it continues.
2. **`express.json()`** reads the body text and turns it into a JavaScript object
   on `req.body`.
3. **`morgan`** remembers the request so it can print a log line when the answer is sent:
   `POST /api/orders/2/proposals 201 14.2 ms`.

Then `app.use('/api', routes)` hands the request to the routers.

### Step 2 — `routes/index.js` → `routes/orders.routes.js`: find the handler

`routes/index.js` sees the path starts with `/orders` and passes it to the orders
router, which has this line:

```js
router.post(
  '/:id/proposals',
  auth,                          // step 3
  requireRole(ROLES.FREELANCER), // step 4
  withId,                        // step 5: validate(idParam, 'params')
  validate(createProposalSchema),// step 5
  proposalsController.create,    // step 6
);
```

Read it left to right: this is the exact order in which things happen. If any
step fails, the later ones never run.

### Step 3 — `middleware/auth.js`: who is this?

1. Takes the `Authorization` header and checks it looks like `Bearer <token>`.
   Missing or malformed → **401**.
2. Verifies the token's signature with `JWT_SECRET` and checks it has not
   expired. Tampered or expired → **401**.
3. The token contains `{ id: 4, role: "FREELANCER" }`. The middleware loads user
   4 from the database. Deleted → **401**. `isBlocked` is true → **403**.
4. Saves the result on the request: `req.user = { id: 4, role: 'FREELANCER' }`.

### Step 4 — `middleware/requireRole.js`: is this the right kind of user?

`requireRole('FREELANCER')` compares `req.user.role` with the allowed roles. A
client trying this URL gets **403** `This action requires role: FREELANCER`.

### Step 5 — `middleware/validate.js`: is the data well-formed?

Two checks run:

- `idParam` makes sure `:id` is a positive integer. `/orders/abc/proposals` → **400**.
- `createProposalSchema` (in `validators/proposals.js`) checks the body: `price`
  an integer from 1 to 1,000,000, `coverLetter` 20-3000 characters after
  trimming spaces.

If anything is wrong, every problem is reported at once:

```json
{
  "message": "Validation failed",
  "details": [
    { "field": "price", "message": "\"price\" must be greater than or equal to 1" },
    { "field": "coverLetter", "message": "\"coverLetter\" length must be at least 20 characters long" }
  ]
}
```

If everything is fine, the **cleaned** values are stored on `req.valid`:
`req.valid.params.id` is now the number `2`, not the string `"2"`, and any
extra field the client sent (say, `status: "ACCEPTED"`) has been dropped.

### Step 6 — `controllers/proposals.controller.js`: hand it to the service

```js
const create = asyncHandler(async (req, res) => {
  res.status(201).json(await proposalsService.create(req.user, req.valid.params.id, req.valid.body));
});
```

That is the whole controller. It picks the inputs off the request, calls the
service, and sends the result with status `201 Created`. It makes no decisions.

### Step 7 — `services/proposals.service.js`: the business rules

```js
const create = async (user, orderId, { price, coverLetter }) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');                          // 404
  if (order.clientId === user.id) throw ApiError.forbidden('...your own order');   // 403
  if (order.status !== ORDER_STATUS.OPEN) throw ApiError.conflict('...OPEN...');   // 409

  try {
    const proposal = await Proposal.create({ orderId, freelancerId: user.id, price, coverLetter });
    return getById(proposal.id);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('You have already sent a proposal for this order');  // 409
    }
    throw error;
  }
};
```

This is where the project's promise — *the system refuses incorrect actions* —
is kept. Notice that the service only knows about users, orders and proposals.
It has no idea it was called over HTTP, which is exactly why it can be reused
(the dashboard and the accept transaction call other services' functions the
same way).

### Step 8 — `models/` and Sequelize: talk to the database

`Proposal.create(...)` becomes SQL:

```sql
INSERT INTO "Proposals" ("orderId", "freelancerId", "price", "coverLetter", "status", ...)
VALUES (2, 4, 700, 'I built a similar...', 'PENDING', ...);
```

Then `getById` reads it back with the freelancer attached (name, rating, review
count), so the answer has the same shape as every other proposal in the API.

### Step 9 — the answer

```http
HTTP/1.1 201 Created
{ "id": 16, "orderId": 2, "freelancerId": 4, "price": 700, "status": "PENDING",
  "viewedByClient": false, "freelancer": { "id": 4, "name": "Anna Hakobyan", "rating": 4.5, "reviewsCount": 2 }, ... }
```

### When it goes wrong: Anna clicks "Send" a second time

Steps 1-7 run again, but this time the `INSERT` violates the database's unique
index on `(orderId, freelancerId)`:

```
Proposal.create(...)                          services/proposals.service.js
   └─ PostgreSQL: duplicate key value violates unique constraint
        └─ Sequelize throws UniqueConstraintError
             └─ the service catches it, throws ApiError.conflict('You have already sent...')
                  └─ asyncHandler passes it to next(error)
                       └─ middleware/errorHandler.js sees an ApiError with status 409
                            └─ res.status(409).json({ message: 'You have already sent a proposal for this order' })
```

The frontend receives a clear sentence it can show as-is. **Every** error in the
backend ends in `errorHandler.js`, which is why all errors have the same
`{ message }` shape.

---

## 5. Concepts, one at a time

### 5.1 Middleware and `next()`

A middleware is a function `(req, res, next)` that runs before the final
handler. It can do one of three things:

- **let the request continue:** call `next()`
- **stop it with an error:** call `next(error)` (or throw, inside an async function)
- **answer right away:** call `res.json(...)`

```js
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires role: ${roles.join(' or ')}`));
  }
  next();
};
```

Because middleware are small and independent, a route reads like a checklist:
`auth, requireRole('CLIENT'), validate(schema), controller`.

### 5.2 Errors: `ApiError` and `errorHandler`

There are two kinds of errors:

- **Expected:** "order not found", "you are not the author", "already reviewed".
  These are thrown on purpose as `ApiError`, which carries an HTTP status:

  ```js
  throw ApiError.notFound('Order not found');   // 404
  throw ApiError.conflict('Already reviewed');  // 409
  ```

- **Unexpected:** a bug, a typo, the database going down. Anything that is not an
  `ApiError` counts as one.

`middleware/errorHandler.js` is registered last in `app.js` and receives every
error:

| It receives | It answers |
|---|---|
| `ApiError` | its own status and message |
| Sequelize `UniqueConstraintError` (a unique index the service did not handle) | 409 `This record already exists` |
| Sequelize `ValidationError` (a model rule like `isEmail`) | 400 with `details` |
| Sequelize `ForeignKeyConstraintError` (an id pointing nowhere) | 400 `Referenced record does not exist` |
| anything else | 500 `Internal server error`, logged in full on the server, stack shown only outside production |

Async functions and errors: when an `async` handler throws, its promise is
rejected. Express 5 forwards that to `errorHandler` by itself. The code still
wraps every async controller in `utils/asyncHandler.js`, which does the same thing
explicitly, so the path of an error is visible in the code and would keep
working on Express 4.

The result: services and controllers never write `try/catch` just to send an
error response. They throw, and the error finds its way out.

### 5.3 Validation with Joi

A Joi schema describes what valid data looks like:

```js
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(500).allow('', null),
});
```

`middleware/validate.js` runs it with three options:

| Option | Effect |
|---|---|
| `abortEarly: false` | Report every bad field, not only the first, so a form can highlight all of them |
| `stripUnknown: true` | Silently drop fields the schema does not list. A client cannot sneak in `status` or `targetId` |
| `convert: true` | Turn `"5"` into `5`, `"true"` into `true`. Query strings and URL params always arrive as text |

The validated values go to `req.valid.body`, `req.valid.query` and
`req.valid.params` — not back into `req.body`. In Express 5, `req.query` cannot be
overwritten, and keeping all three in one place means a controller can only ever
see data that passed a schema.

Validation answers "is this well-formed?" (is `rating` a number from 1 to 5?).
It does **not** answer "is this allowed?" (is the order completed? did you
already review it?). That needs the database and belongs to the service.

### 5.4 Passwords: bcrypt

The database never stores a password. It stores a **hash**: the output of a
one-way function.

```
"anna123"  ──bcrypt──▶  "$2b$10$Jx8...Q6"     (cannot be turned back into "anna123")
```

At login, bcrypt hashes the typed password the same way and compares the two
hashes. If the database leaks, the attacker gets hashes, not passwords. bcrypt
also adds a random **salt** to every hash, so two users with the same password
get different hashes, and it is deliberately slow (`SALT_ROUNDS = 10`, about
0.1 s), which makes guessing millions of passwords expensive.

Two more details in `services/auth.service.js`:

- Wrong email and wrong password give **the same** message, `Invalid email or
  password`. Different messages would let anyone find out which emails are
  registered.
- `passwordHash` is removed in `User.prototype.toJSON` (in `models/User.js`), so
  it cannot leak through any response, even by accident.

### 5.5 Authentication: JWT

HTTP has no memory: each request arrives on its own. A **token** is how the
server recognizes you on the next request.

After login, the server creates a **JSON Web Token**, a string of three parts:

```
eyJhbGciOiJIUzI1NiJ9 . eyJpZCI6NCwicm9sZSI6IkZSRUVMQU5DRVIiLCJleHAiOjE3...} . 3kq9X...
      header                         payload                                  signature
```

The payload is just base64 — anyone can decode it and read `{ id: 4, role:
"FREELANCER", exp: ... }`. So **a JWT is not secret, it is signed**. The
signature is computed with `JWT_SECRET`, which only the server knows. If anyone
changes a single character of the payload (say, `role` to `ADMIN`), the signature
no longer matches and `jwt.verify` rejects it.

The frontend stores the token and sends it with every request:
`Authorization: Bearer <token>`.

**Why the user is loaded on every request.** A JWT cannot be cancelled once
issued; it stays valid until it expires. If the server trusted the token alone,
blocking a user would have no effect for up to 7 days. So `middleware/auth.js`
reads the user from the database each time and rejects them if `isBlocked` is
true. The cost is one fast query per request; the benefit is that blocking works
immediately.

**401 or 403?** They are often confused:

| Code | Means | Frontend should |
|---|---|---|
| **401 Unauthorized** | "I don't know who you are": no token, bad token, expired token | log out and go to the login page |
| **403 Forbidden** | "I know who you are, but you can't do this": wrong role, not your order, blocked | show the message, stay logged in |

### 5.6 Roles

There are three: `CLIENT`, `FREELANCER`, `ADMIN` (defined once, in
`config/constants.js`). Role checks happen at two levels:

- **By role, in the route:** `requireRole('CLIENT')` on `POST /orders` — only
  clients create orders. Cheap and declared up front.
- **By ownership, in the service:** "only *the author of this order* can edit it".
  This needs the order from the database, so it cannot be done in the route.

Registration only accepts `CLIENT` or `FREELANCER`. The single admin account is
created by the seed; otherwise anyone could register as an admin.

### 5.7 The database and Sequelize

**Models** describe tables. Each file in `src/models/` is a small function that
defines one table:

```js
module.exports = (sequelize) =>
  sequelize.define('Message', {
    body: { type: DataTypes.TEXT, allowNull: false },
  });
```

Sequelize adds `id`, `createdAt` and `updatedAt` to every table automatically.

**Associations** describe how tables point at each other, and all of them live in
`models/index.js`:

```js
Order.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Order.belongsTo(User, { as: 'freelancer', foreignKey: 'freelancerId' });
```

A **foreign key** is a column holding another row's id: `Order.clientId = 2`
means "this order belongs to user 2". The database refuses a foreign key pointing
at a row that does not exist.

An order points at `User` **twice** (its client and its freelancer), so each
relation gets a name, an **alias**: `client` and `freelancer`. That is why every
`include` must say which one it means:

```js
Order.findByPk(1, {
  include: [
    { model: User, as: 'client', attributes: ['id', 'name'] },
    { model: User, as: 'freelancer', attributes: ['id', 'name'] },
  ],
});
// → { id: 1, title: "...", client: { id: 2, name: "Karen" }, freelancer: null }
```

`include` is Sequelize's word for a SQL `JOIN`: load related rows in the same
query. `attributes` limits which columns are selected, which is how nested users
never carry an email.

**Creating tables.** There are no migration files. On startup, `server.js` calls
`sequelize.sync({ alter: true })`, which compares the models with the real tables
and adds or changes columns to match. It is convenient while the models change
every day, but it can lose data on some changes, so production runs a plain
`sync()` that only creates missing tables. Proper migrations are listed as future
work.

### 5.8 Values that are computed, not stored

A user's `rating` is not a column. It is calculated every time from the reviews
where they are the target:

```sql
(SELECT ROUND(AVG(r."rating"), 1)::float FROM "Reviews" AS r WHERE r."targetId" = "User"."id")
```

This lives in `services/query.helpers.js` and is added to queries as an extra
attribute. Why not store it? A stored rating would have to be updated on every
new review, and one forgotten update would make it wrong forever. A computed one
is always right, and because it is part of the same SQL query, the freelancer
list can be sorted by it without loading every review into Node.

`proposalsCount` on orders and `ordersCount` on admin categories work the same way.

### 5.9 Pagination

Lists are returned one page at a time. `utils/pagination.js` turns `page` and
`limit` into SQL:

```
page=2, limit=10  →  OFFSET 10 LIMIT 10   (skip the first 10 rows, take the next 10)
```

`findAndCountAll` runs two queries — the page of rows and the total count — and
`buildPage` wraps them in the envelope every list uses:

```json
{ "items": [ ... ], "total": 13, "page": 2, "pages": 2 }
```

`limit` is capped at 50 so a single request cannot ask for the whole table.

### 5.10 The order status machine

An order moves through statuses, and only some moves are legal. Instead of a
chain of `if`s, `services/orders.service.js` keeps them in one table:

```js
const TRANSITIONS = {
  OPEN:        { CANCELLED: 'client' },
  IN_PROGRESS: { REVIEW: 'freelancer', CANCELLED: 'client' },
  REVIEW:      { COMPLETED: 'client' },
  COMPLETED:   {},
  CANCELLED:   {},
};
```

Read it as: "from `IN_PROGRESS`, the order can go to `REVIEW` (only the
freelancer may do that) or to `CANCELLED` (only the client)". `changeStatus`
checks a request in this order:

1. The order exists → otherwise **404**
2. The user is the client or the assigned freelancer → otherwise **403**
3. `TRANSITIONS[current][requested]` exists → otherwise **409** "Cannot change status from OPEN to COMPLETED"
4. It names the user's side → otherwise **403** "Only the order freelancer can move it to REVIEW"

`OPEN → IN_PROGRESS` is missing on purpose. An order starts only when a proposal
is accepted, because starting it also means assigning a freelancer. A bare status
change would create an order "in progress" with nobody working on it.

`COMPLETED` and `CANCELLED` have no way out: they are final.

### 5.11 Transactions and row locks: accepting a proposal

When the client accepts a proposal, three things must change together:

1. the chosen proposal → `ACCEPTED`
2. every other pending proposal of the order → `REJECTED`
3. the order → `IN_PROGRESS`, with `freelancerId` set

If the server crashed after step 1, you would have an accepted proposal on an
order that is still open. A **transaction** prevents that: the database applies
all the changes or none of them.

```js
await sequelize.transaction(async (transaction) => {
  // ...every query inside gets { transaction }...
  // throwing anywhere in here undoes everything (a "rollback")
});
```

The second problem is **two requests at the same time**. Imagine the client
double-clicks, or has two tabs open, and accepts Anna's and Davit's proposals in
the same millisecond. Without protection:

```
Request A (accept Anna)              Request B (accept Davit)
read order: OPEN ✓                   read order: OPEN ✓        ← both see OPEN
set Anna ACCEPTED                    set Davit ACCEPTED
order → IN_PROGRESS, Anna            order → IN_PROGRESS, Davit ← two winners, last write wins
```

The fix is a **row lock**. The service reads the order with
`lock: transaction.LOCK.UPDATE` (SQL `SELECT ... FOR UPDATE`). The first request
to lock the order row gets it; the second **waits** until the first finishes:

```
Request A                            Request B
lock order row ✓                     lock order row … waiting …
check OPEN ✓, update everything
commit, release lock  ─────────────▶ lock order row ✓
                                     check OPEN ✗ (it is IN_PROGRESS now)
                                     → 409 "Order is no longer OPEN"
```

The order row is always locked **first**, before any proposal. If one request
locked a proposal first and another locked the order first, each could end up
waiting for the other forever (a **deadlock**). Locking in the same order every
time makes that impossible. This was tested by firing four accepts at once: one
succeeds, three get 409.

### 5.12 Let the database enforce uniqueness

"One proposal per order per freelancer" could be checked like this:

```js
const exists = await Proposal.findOne({ where: { orderId, freelancerId } });
if (exists) throw ApiError.conflict('Already sent');
await Proposal.create(...);
```

It looks right but has the same race as above: two requests can both run
`findOne`, both see nothing, and both create a proposal. Instead, the `Proposal`
model declares a **unique index** on `(orderId, freelancerId)`. The database
itself refuses a second row with the same pair, no matter how the requests are
timed. The service simply tries to insert and translates the database's refusal
into a friendly 409 (see step 7 of section 4).

The same idea protects "one review per author per order" and "one account per
email".

### 5.13 CORS

Browsers protect users by refusing to let one website read responses from another
website's API, unless that API says it is allowed. That permission is **CORS**
(Cross-Origin Resource Sharing).

The frontend runs on `localhost:5173` and the API on `localhost:4000`. Different
ports count as different sites, so the API must explicitly allow the frontend.
`app.js` allows:

- requests with **no** `Origin` header — curl, Postman, server-to-server; CORS
  only matters for browsers
- origins listed in `CLIENT_URL`
- the API's own host — that is Swagger UI at `/api/docs`, which runs on port 4000
  itself

Everything else gets **403** `Origin ... is not allowed by CORS`. If you see that
error, the frontend's address is missing from `CLIENT_URL`.

### 5.14 Swagger and OpenAPI

`backend/openapi.yaml` describes every endpoint in a standard format called
**OpenAPI**: paths, parameters, request bodies, response shapes, error codes.
`src/config/openapi.js` loads it once, and `swagger-ui-express` turns it into the
interactive page at `/api/docs`.

The YAML file is written by hand. It is not generated from the code, so when an
endpoint changes, `openapi.yaml`, `docs/API.md` and `frontend/src/types/` must be
updated together.

---

## 6. Where each business rule lives

| Rule | Enforced in | How | Refusal |
|---|---|---|---|
| Only clients create orders | `routes/orders.routes.js` | `requireRole(CLIENT)` | 403 |
| Only the author edits an order, only while `OPEN` | `orders.service.js` → `update` | ownership and status checks | 403 / 409 |
| Status moves follow the map | `orders.service.js` → `TRANSITIONS`, `changeStatus` | lookup in the map | 403 / 409 |
| `OPEN → IN_PROGRESS` only by accepting | `orders.service.js` (missing from the map) + `proposals.service.js` → `accept` | | 409 |
| Cancelling an open order rejects its pending proposals | `orders.service.js` → `changeStatus` | inside a transaction | |
| One proposal per order per freelancer | `models/Proposal.js` | **unique index** `(orderId, freelancerId)` | 409 |
| Proposals only on `OPEN` orders | `proposals.service.js` → `create` | status check | 409 |
| Only the order's client sees its proposals | `proposals.service.js` → `listByOrder` | ownership check | 403 |
| Accepting is all-or-nothing and race-safe | `proposals.service.js` → `accept` | transaction + `SELECT ... FOR UPDATE` | 409 |
| Chat only between client and assigned freelancer | `messages.service.js` → `loadOrderForChat` | `participantRole` | 403 |
| No chat before a freelancer is assigned | `messages.service.js` → `create` | `freelancerId` check | 409 |
| Reviews only on `COMPLETED` orders, by participants | `reviews.service.js` → `create` | status and participant checks | 409 / 403 |
| One review per order per author | `models/Review.js` | **unique index** `(orderId, authorId)` | 409 |
| The reviewed person is set by the server | `reviews.service.js` → `create` | `targetId` derived from the order; Joi strips it from the body | |
| One account per email | `models/User.js` | **unique** column + check in `auth.service.js` | 409 |
| No one registers as admin | `validators/auth.js` | `role` must be `CLIENT` or `FREELANCER` | 400 |
| Blocked users are locked out immediately | `middleware/auth.js` | `isBlocked` read on every request | 403 |
| An admin cannot block themselves | `admin.service.js` → `setBlocked` | id comparison | 409 |
| A category in use cannot be deleted | `admin.service.js` → `deleteCategory` | count of orders | 409 |
| Passwords are never returned | `models/User.js` → `toJSON` | hash removed from every serialized user | |

---

## 7. Recipe: adding an endpoint

As an example, suppose the frontend wants `GET /api/categories/:id` to return one
category. (This endpoint does not exist; it is just the smallest useful example.)

**1. Validator.** Nothing new here: `idParam` in `validators/common.js` already
checks `:id`. For a new body or query, add a Joi schema to the feature's
validator file.

**2. Service** (`services/categories.service.js`) — the logic, no `req`/`res`:

```js
const { ApiError } = require('../utils/ApiError');

const getById = async (id) => {
  const category = await Category.findByPk(id, { attributes: ['id', 'name', 'slug'] });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

module.exports = { list, getById };
```

**3. Controller** (`controllers/categories.controller.js`) — read input, call, answer:

```js
const getById = asyncHandler(async (req, res) => {
  res.json(await categoriesService.getById(req.valid.params.id));
});

module.exports = { list, getById };
```

**4. Route** (`routes/categories.routes.js`) — path and checks:

```js
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');

router.get('/:id', validate(idParam, 'params'), categoriesController.getById);
```

Add `auth` and `requireRole(...)` before `validate` if the endpoint is not public.

**5. Try it:** `curl http://localhost:4000/api/categories/1`, then
`/categories/999` (404) and `/categories/abc` (400).

**6. Document it** — the step everyone forgets:

- add the path to `backend/openapi.yaml`
- add a row to `docs/API.md`
- add or update the type in `frontend/src/types/` if the response is a new shape

---

## 8. Demo data

`src/seed.js` creates data that exercises every screen:

- 8 categories
- 7 users: an admin, two clients, three freelancers, and one blocked account
- 13 orders in every status, spread over the last two months
- 15 proposals (some unseen by the client, some accepted, some rejected)
- 11 chat messages on orders in progress
- 6 reviews, so ratings differ between freelancers

`npm run seed` is **idempotent**: running it again creates nothing new. Users and
categories are matched by their unique email or name; orders are only created
when the orders table is empty. `npm run seed -- --fresh` deletes everything first
— use it to undo whatever you broke while testing.

The accounts, their passwords and useful ids are listed in the last section of
[`API.md`](API.md) and at the top of the Swagger page.

---

## 9. Troubleshooting

**`Missing required environment variables: DATABASE_URL`** — there is no
`backend/.env`, or a key is empty. Copy `.env.example` to `.env` and fill it in.

**`connect ECONNREFUSED 127.0.0.1:5432`** — PostgreSQL is not running. Start it
(`sudo systemctl start postgresql` on Linux, or the Postgres app on macOS/Windows).

**`password authentication failed for user "postgres"`** — the user or password
in `DATABASE_URL` is wrong.

**`database "freelancehub" does not exist`** — run `createdb freelancehub`.

**`listen EADDRINUSE: address already in use :::4000`** — another server is
already running on port 4000, probably a second `npm run dev` in another
terminal. Stop it, or find it with `lsof -i :4000`.

**403 `Origin http://localhost:5174 is not allowed by CORS`** — Vite started on a
different port because 5173 was busy. Free the port, or add the new address to
`CLIENT_URL` (comma-separated) and restart the backend.

**Everything returns 401 after `npm run seed -- --fresh`** — the database was
recreated, so the user inside your old token no longer exists. Log in again.

**`User is associated to Order multiple times. To identify the correct
association, you must use the 'as' keyword...`** — an `include` is missing `as`.
Use the alias from `models/index.js`: `client`, `freelancer`, `author`, `target`,
`sender`, `category`, `order`.

**Startup fails inside `sync` after changing a model** (often an ENUM change) —
`alter` could not convert the existing column. In development, reset with
`npm run seed -- --fresh`.

**A 500 response** — a bug. Outside production the response includes `stack`,
and the terminal running the server prints the full error. Read the first line
of the stack that points into `src/`.

---

## 10. Deploying

The free setup that fits this project:

| Part | Service | Note |
|---|---|---|
| Database | **Neon** (PostgreSQL) | Free databases do not expire |
| Backend | **Render** (Web Service) | Free instances sleep after ~15 min idle; the first request then takes up to a minute. Open `/api/health` before a demo |
| Frontend | **Vercel** | |

Checklist:

1. Neon: create a database, copy its connection string into `DATABASE_URL`.
2. Render: root directory `backend`, build `npm install`, start `npm start`.
   Environment: `NODE_ENV=production`, `DATABASE_URL`, a **new** `JWT_SECRET`
   (never reuse the local one), `CLIENT_URL` = your Vercel address. `PORT` is set
   by Render.
3. With `NODE_ENV=production`: the database connection uses SSL, `sync` does not
   alter existing tables, and error responses hide the stack.
4. Run the seed once against the production database to get demo accounts (from
   your machine, with `DATABASE_URL` pointing at Neon and `NODE_ENV=production`;
   `--fresh` is refused there by design). Those demo passwords are public — fine
   for a demo, not for real users.
5. Vercel: set `VITE_API_URL=https://<your-render-app>.onrender.com/api` before
   building. Vite bakes it into the bundle, so changing it requires a redeploy.
6. After Vercel gives you the final address, put it in `CLIENT_URL` on Render.

---

## 11. Known limitations

These are deliberate MVP choices, listed so nobody mistakes them for oversights:

- **No migrations.** Tables come from `sync()`. Changing a column on a production
  database needs a real migration tool (sequelize-cli, umzug).
- **Chat by polling.** The frontend asks for new messages every 5 seconds. Instant
  delivery would need WebSockets.
- **No automated tests.** The API was verified with scripted end-to-end runs, but
  they are not part of the repository.
- **Token in localStorage, no refresh tokens.** Simple and common for an MVP; a
  hardened setup would use httpOnly cookies with CSRF protection and short-lived
  tokens.
- **No rate limiting** on login or registration.
- **No payments, file uploads or email.** Avatars and portfolios are plain URLs.
- **Category slugs are Latin-only.** A name with no Latin letters or digits is rejected.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **API** | The set of URLs the frontend can call, and what each one accepts and returns |
| **Endpoint** | One URL + method, e.g. `POST /api/orders` |
| **HTTP method** | `GET` reads, `POST` creates, `PATCH` changes part of something, `DELETE` removes |
| **Status code** | The number in every response: 2xx success, 4xx the client did something wrong, 5xx the server broke |
| **JSON** | The text format requests and responses use: `{ "id": 1, "title": "..." }` |
| **Middleware** | A function that runs before the final handler and can stop the request |
| **ORM** | A library (Sequelize) that maps tables to JavaScript objects and writes SQL for you |
| **Model** | The JavaScript description of one table |
| **Primary key** | The unique `id` column of a table |
| **Foreign key** | A column holding the `id` of a row in another table |
| **Index / unique index** | A database structure for fast lookups; a unique one also forbids duplicates |
| **Association** | A relation between models: `belongsTo`, `hasMany` |
| **Include** | Loading related rows in the same query (a SQL `JOIN`) |
| **Transaction** | A group of database changes applied all together or not at all |
| **Row lock** | Making other transactions wait before they can change the same row |
| **Race condition** | A bug that appears only when two requests run at the same moment |
| **Hash** | A one-way transformation; used for passwords so they cannot be read back |
| **JWT** | A signed token that proves who you are on every request |
| **CORS** | Browser permission for one website to call an API on another address |
| **Idempotent** | Safe to repeat: running it twice has the same result as once |
| **Seed** | A script that fills the database with starting data |
| **OpenAPI / Swagger** | A standard description of an API, and the tool that turns it into an interactive page |
