# FreelanceHub

Freelance marketplace, a portfolio project for a frontend interview, MVP level. A client
posts an order, freelancers send proposals, the client picks one, both sides
review each other afterwards. The point of the project is that the system
**refuses incorrect actions**, so rules matter more than features.

Reference docs — read the relevant one before writing code:
`docs/API.md` (endpoint overview), `backend/openapi.yaml` (detailed contract,
served as Swagger UI at `/api/docs`), `docs/DB.md` (data model),
`docs/BACKEND.md` (how the backend works, for beginners), `docs/PLAN.md` (plan). A change to the API updates all three: `openapi.yaml`, `docs/API.md` and
`frontend/src/types/`.

## Division of labor

The backend (`backend/`) is written by Claude. The frontend (`frontend/`) is
written by the user on top of `docs/API.md` — do not implement frontend files
unless explicitly asked. The `frontend/src` files currently hold a single
placeholder comment each; that is intentional.

## Stack — decided, do not propose alternatives

Backend: Node + Express 5, Sequelize + PostgreSQL, Joi, jsonwebtoken, bcrypt,
cors, morgan, dotenv, swagger-ui-express + yaml (serves `backend/openapi.yaml`). **CommonJS** (`require` / `module.exports`, never `import`
or `export`); requires are written without the `.js` extension.

Frontend: React 18 + **TypeScript** (strict), Vite, react-router-dom, Zustand,
TanStack Query, axios. `.tsx` for files with JSX, `.ts` for everything else.
Shared types live in `frontend/src/types/` and mirror `docs/DB.md` and
`docs/API.md` — the API contract is the single source of truth, so types follow
the docs, never the other way round.

The backend stays plain JavaScript — do not convert it to TypeScript, and do
not convert it to ESM.

Prisma, zod, MongoDB, Mongoose and sequelize-cli migrations were considered and
rejected. Do not suggest them again; if one is genuinely needed, say why in one
sentence and wait.

## Architecture

- `routes → controllers → services`. Routes hold paths and middleware only.
  Controllers read `req`, call a service, send `res.json()` — no database access.
  Services own all business logic and transactions — no `req`/`res`.
- One model per file in `backend/src/models/` as a factory
  `(sequelize) => sequelize.define(...)`. All associations live in
  `models/index.js`, nothing else. Four `belongsTo(User)` aliases exist —
  `client`, `freelancer`, `author`, `target` — so every `include` needs `as`.
- Tables come from `sequelize.sync({ alter: true })` at startup. No migrations.
- Expected errors are thrown as `ApiError`; async controllers are wrapped in
  `asyncHandler`, so no `try/catch` in controllers.

## Contracts

- List responses: `{ items, total, page, pages }`. Query: `page`, `limit`.
- Errors: `{ message }`, plus `details[]` for Joi validation failures.
- Enums are UPPER_CASE: roles `CLIENT|FREELANCER|ADMIN`, order status
  `OPEN|IN_PROGRESS|REVIEW|COMPLETED|CANCELLED`, proposal status
  `PENDING|ACCEPTED|REJECTED`.
- Money is an integer; dates are ISO 8601 UTC; `passwordHash` is never returned.
- Every request body, query and param goes through a Joi schema via
  `middleware/validate.js`.

## Business rules that must not be weakened

1. One proposal per order per freelancer (composite unique index → 409).
2. One review per order per author (composite unique index → 409).
3. Accepting a proposal happens in a single transaction: chosen `ACCEPTED`,
   others `REJECTED`, order `IN_PROGRESS` with `freelancerId` set.
4. Status transitions are strict: `IN_PROGRESS → REVIEW` by the freelancer,
   `REVIEW → COMPLETED` by the client, `OPEN|IN_PROGRESS → CANCELLED` by the
   client. `OPEN → IN_PROGRESS` only through accepting a proposal.
5. Reviews only on `COMPLETED` orders, by participants, with `targetId`
   resolved server-side.
6. An order can be edited only by its author and only while `OPEN`.
7. Order chat is limited to the client and the assigned freelancer.
8. `isBlocked` is checked on every request, not only at login.

## Code conventions

- Comments, commit messages and identifiers in English. Conversation with the
  user stays in Russian.
- Backend comments explain non-obvious decisions at normal density. The project is
  judged on its frontend; the backend is a tool the user builds against.
  Comment the `acceptProposal` transaction and the status transition map
  thoroughly.
- Small commits, English messages, feature branches (`feat/orders`), `main`
  always runs.

## Commands

```bash
cd backend  && npm run dev    # nodemon, port 4000
cd backend  && npm run seed   # categories + demo users + sample orders
cd backend  && npm run seed -- --fresh   # drop everything and reseed (dev only)
# Swagger UI: http://localhost:4000/api/docs
cd frontend && npm run dev    # Vite, port 5173
```

`backend/.env` is gitignored; `backend/.env.example` lists every required key.

## Out of scope

Sockets (chat uses 5s polling by design), payments, file uploads, migrations,
automated tests, email. Do not add them unasked — they belong in the README's
"Future work" section.
