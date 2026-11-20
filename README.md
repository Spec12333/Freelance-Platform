<div align="center">

# FreelanceHub

**From a project brief to a finished collaboration.**

A full-stack freelance marketplace where clients find talent, freelancers find work,
and both sides manage proposals, conversations, delivery and feedback in one place.

[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](frontend/package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](frontend/tsconfig.json)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-ff4154?logo=reactquery&logoColor=white)](frontend/src/hooks)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-WebSocket-010101?logo=socketdotio&logoColor=white)](backend/src/realtime/chat.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-108a00)](LICENSE)

[Features](#features) · [Screenshots](#screenshots) · [Architecture](#architecture) · [Local setup](#local-setup) · [Demo accounts](#demo-accounts)

</div>

![FreelanceHub marketplace with search, category and budget filters, and project cards](docs/images/orders.png)

## About

FreelanceHub is a portfolio project built around a complete marketplace workflow:
publish a brief, compare proposals, choose a freelancer, discuss the work, approve
delivery and exchange reviews. It includes separate client, freelancer and
administrator workspaces, backed by a real PostgreSQL database.

The frontend uses an English interface, a shared forest-green and lime palette,
responsive layouts and reusable UI components. The implementation also handles
the less visible parts of the workflow: session restoration, stale data, failed
requests, duplicate submissions and actions that a user's role or project status
does not permit.

**Status:** the core MVP is implemented and has passed a local integration check
using the real API, PostgreSQL and separate browser sessions. A public deployment
is not included yet. See the [development plan](docs/PLAN.md) for validation details
and remaining delivery work.

## Features

| Workspace | What you can do |
|---|---|
| **Client** | Create project briefs with a category, budget and deadline; edit or delete open orders; compare proposals; choose a freelancer; cancel eligible projects; approve delivery; leave a review. |
| **Freelancer** | Search for work; create, edit or withdraw pending proposals on open orders; manage active assignments; submit work for review; edit a profile, skills, hourly rate and portfolio link; upload or remove an avatar; review the client. |
| **Administrator** | Search users by name or email; filter by role and access status; block or unblock accounts; create, rename and delete unused categories; view platform statistics. |

### Shared experience

- **Search and discovery.** Paginated orders with title search, category, status
  and budget filters; a freelancer directory with name, skill and hourly-rate
  filters, plus rating or rate sorting.
- **Shareable filters.** Applied filters and pagination live in the URL. Search
  waits 400 ms after typing, while submitting the form applies it immediately.
  Previous results stay visible while the next request loads.
- **Private project chat.** Socket.IO over WebSocket, saved message history,
  connection feedback and recovery after reconnecting. Conversations open after
  a freelancer is assigned and are limited to the two project participants.
- **Profiles and reputation.** Linked avatars, public-facing profile pages,
  received reviews and ratings calculated from completed collaborations.
- **Role-specific dashboards.** Project summaries, active work, proposal counts
  and administration totals. A client's unread-proposal badge refreshes every
  30 seconds while the tab is visible and updates after proposals are viewed.
- **Consistent UI states.** Loading, empty, error and retry states, 403/404 views,
  pending-action controls, confirmation dialogs and field validation feedback.

## Screenshots

Screenshots show the current application with the repository's demo seed data.
The marketplace above is the desktop view; expand below to see more screens.

<details>
<summary><strong>Client dashboard</strong></summary>

Project totals, unread proposals, recent orders and a status breakdown.

![Client dashboard with project statistics and recent orders](docs/images/client-dashboard.png)

</details>

<details>
<summary><strong>Freelancer profile</strong></summary>

Professional details, skills, hourly rate, portfolio and received feedback.

![Anna Hakobyan's profile with skills, hourly rate and client reviews](docs/images/freelancer-profile.png)

</details>

<details>
<summary><strong>Project chat</strong></summary>

A private conversation with persisted messages and WebSocket connection feedback.

![Project chat between the client and assigned freelancer](docs/images/order-chat.png)

</details>

<details>
<summary><strong>Mobile marketplace</strong></summary>

<p align="center">
  <img src="docs/images/orders-mobile.png" width="390" alt="FreelanceHub orders and filters on a mobile screen" />
</p>

</details>

## Project workflow

```mermaid
flowchart LR
    Open["OPEN"] -->|"Client accepts a proposal"| Active["IN_PROGRESS"]
    Active -->|"Freelancer submits work"| Review["REVIEW"]
    Review -->|"Client approves delivery"| Complete["COMPLETED"]
    Open -->|"Client cancels"| Cancelled["CANCELLED"]
    Active -->|"Client cancels"| Cancelled
```

These rules are enforced by the backend as well as reflected in the interface:

- An order can be edited or deleted only by its client while it is `OPEN`.
- A freelancer can have only one proposal per order. A pending proposal can be
  edited or withdrawn while the order remains open.
- Accepting a proposal assigns the freelancer, accepts their proposal, rejects
  competing pending proposals and starts the order in one database transaction.
  Concurrent selections are serialized with row locks.
- Only the assigned freelancer can submit work for review; only the client can
  mark it completed.
- Reviews are available after completion, once per participant per order. The
  server determines the recipient rather than trusting a submitted user ID.
- Blocked accounts are refused on authenticated requests, and their active chat
  connections are disconnected. Administrators cannot block themselves.
- Categories referenced by orders cannot be deleted.

Unique database constraints protect emails, proposals and reviews against
duplicates, including concurrent requests.

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript with strict checks, Vite 5 |
| **Routing and state** | React Router 6, TanStack Query 5, Zustand 5 |
| **Forms and styling** | React Hook Form 7, Tailwind CSS 4, inline SVG icons |
| **HTTP and real time** | Axios, Socket.IO 4 over WebSocket |
| **Backend** | Node.js, Express 5, JavaScript with CommonJS modules |
| **Database** | PostgreSQL, Sequelize 6 |
| **Validation and authentication** | Joi, JSON Web Tokens, bcrypt |
| **Images and API documentation** | sharp, OpenAPI 3, Swagger UI |

## Architecture

```mermaid
flowchart LR
    subgraph Frontend["React frontend"]
        Pages["Pages and feature components"] --> Hooks["TanStack Query hooks"]
        Auth["Zustand session store"] --> HTTP["Axios API client"]
        Hooks --> HTTP
        Live["Chat socket subscription"] --> Hooks
    end
    subgraph Backend["Node.js backend"]
        Routes["Routes and middleware"] --> Controllers["Controllers"]
        Controllers --> Services["Services"]
        Services --> Models["Sequelize models"]
        Socket["Socket.IO server"]
    end
    HTTP -->|"REST API"| Routes
    Models --> DB[("PostgreSQL")]
    Controllers -->|"Saved-message events"| Socket
    Socket -->|"WebSocket events"| Live
```

**Frontend.** API calls live in `api/`; feature hooks own server-data queries and
mutations. TanStack Query manages caching and refreshes related resources after
changes. Zustand stores the session in local storage, and `/auth/me` validates
the saved session before protected routes render. Private queries include the
current account in their keys, and logout clears the query cache.

**Backend.** Requests pass through authentication, role checks and Joi validation.
Controllers handle HTTP input and output; services own business rules,
authorization and transactions. Sequelize models define the database structure,
with associations configured in one place. The API excludes password hashes and
limits email exposure to the account owner and administrators.

**Chat.** Messages are sent and saved through REST. After a successful save, the
server emits `message:new` to authorized participants in the order's room. The
frontend refreshes the relevant message query. On reconnect, `chat:ready` triggers
a history refresh to recover missed messages. Chat does not poll on a timer; the
unread-proposal badge uses a separate polling mechanism.

**Avatars.** Freelancer uploads accept non-animated JPEG, PNG or WebP files up to
5 MiB and 16 megapixels. The server decodes the image, strips metadata and stores
a square WebP of up to 512 × 512 pixels in a separate PostgreSQL `Avatars` table.
Ordinary profile responses contain an image URL, not binary data.

### Repository structure

```text
Freelance-Platform/
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios functions and the shared QueryClient
│   │   ├── components/
│   │   │   ├── ui/          # Shared visual and interaction primitives
│   │   │   ├── layout/      # Navigation and page shells
│   │   │   └── .../         # orders, proposals, chat, reviews, profile, etc.
│   │   ├── hooks/           # Queries, mutations and socket subscriptions
│   │   ├── pages/           # Routed screens, including administration
│   │   ├── store/           # Persisted authentication state
│   │   ├── types/           # API, model and chat contracts
│   │   └── utils/           # Formatting, filters and shared constants
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/          # Endpoints and middleware composition
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── services/        # Business rules and database operations
│   │   ├── models/          # Sequelize models and associations
│   │   ├── validators/      # Joi schemas
│   │   ├── middleware/      # Authentication, validation and errors
│   │   ├── realtime/        # Socket.IO authentication and delivery
│   │   ├── events/          # In-process domain events
│   │   ├── config/          # Environment, CORS and OpenAPI configuration
│   │   └── seed.js          # Demo accounts and marketplace data
│   ├── openapi.yaml
│   └── .env.example
├── docs/                    # API, database, design and development guides
└── LICENSE
```

## Local setup

### Prerequisites

- Node.js **20.9 or newer** and npm.
- PostgreSQL **14 or newer**, running locally or available through a connection URL.
- Git. The PostgreSQL CLI commands below also require `createdb` to be available.

Run the following commands from the repository root unless stated otherwise.
The frontend and backend have separate packages and lockfiles.

### 1. Clone and install

```bash
git clone https://github.com/Spec12333/Freelance-Platform.git
cd Freelance-Platform

npm --prefix backend ci
npm --prefix frontend ci

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure the database and environment

Create an empty local database using your PostgreSQL account:

```bash
createdb -h localhost -U postgres freelancehub
```

Edit `backend/.env`: set `DATABASE_URL` to your actual PostgreSQL username,
password, host and database. The example uses
`postgres://postgres:postgres@localhost:5432/freelancehub`; replace those
credentials if your local installation differs.

Generate a JWT signing secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` in `backend/.env`.

| File | Variable | Purpose / local value |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | Required PostgreSQL connection string |
| `backend/.env` | `JWT_SECRET` | Required signing secret generated above |
| `backend/.env` | `JWT_EXPIRES_IN` | Token lifetime; defaults to `7d` |
| `backend/.env` | `NODE_ENV` | `development` for local use |
| `backend/.env` | `PORT` | API port; defaults to `4000` |
| `backend/.env` | `CLIENT_URL` | Allowed browser origin: `http://localhost:5173`; supports a comma-separated list |
| `frontend/.env` | `VITE_API_URL` | REST base URL: `http://localhost:4000/api` |
| `frontend/.env` | `VITE_SOCKET_URL` | Optional Socket.IO origin; defaults to the origin of `VITE_API_URL` |

Use an origin without `/api` for `VITE_SOCKET_URL`. Keep secrets on the backend:
Vite exposes `VITE_*` variables to the browser. Local `.env` files are gitignored.

### 3. Create tables and load the demo

```bash
npm --prefix backend run seed
```

On an empty database, the seed creates **8 categories, 7 users and 13 orders**,
including pending proposals, active conversations and completed projects with
reviews. It reuses existing users and categories on subsequent runs and skips
marketplace creation when orders already exist.

<details>
<summary>Reset a disposable development database</summary>

```bash
npm --prefix backend run seed -- --fresh
```

This **drops and recreates the application tables**, deleting their existing
data. Use it only for a disposable development database. The command refuses to
run with `NODE_ENV=production`.

</details>

### 4. Start both applications

In one terminal:

```bash
npm --prefix backend run dev
```

In a second terminal:

```bash
npm --prefix frontend run dev
```

| Service | Local URL |
|---|---|
| Application | [http://localhost:5173](http://localhost:5173) |
| API health endpoint | [http://localhost:4000/api/health](http://localhost:4000/api/health) |
| Swagger UI | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) |
| OpenAPI JSON | [http://localhost:4000/api/openapi.json](http://localhost:4000/api/openapi.json) |

The application opens with authentication. Register as a client or freelancer,
or use a demo account below. Administrator registration is deliberately disabled;
the seed provides that account.

## Demo accounts

These are public development credentials defined in
[`backend/src/seed.js`](backend/src/seed.js). Use them only in a disposable demo
environment; do not use the seeded administrator credentials for a real service.

| Role | Name | Email | Password |
|---|---|---|---|
| Client | Karen Petrosyan | `client@freelancehub.dev` | `client123` |
| Client | Lilit Sargsyan | `lilit@freelancehub.dev` | `lilit123` |
| Freelancer | Anna Hakobyan | `anna@freelancehub.dev` | `anna123` |
| Freelancer | Davit Grigoryan | `davit@freelancehub.dev` | `davit123` |
| Freelancer | Mariam Avetisyan | `mariam@freelancehub.dev` | `mariam123` |
| Administrator | Site Admin | `admin@freelancehub.dev` | `admin123` |
| Blocked freelancer | Blocked Account | `blocked@freelancehub.dev` | `blocked123` |

### Suggested walkthrough

1. Open a normal browser window as **Karen** and a private window as **Anna**.
2. As Karen, create an order. As Anna, find it and send a proposal.
3. Return to Karen's window, open the project's proposals and choose Anna.
4. Open the project in both windows and exchange messages in the chat.
5. As Anna, submit the work for review. As Karen, approve completion.
6. Leave a review from each account and inspect the updated profiles.
7. Sign in as the administrator to explore user access and category management.

For an existing seeded chat, open **“Redesign of a mobile app profile screen”**
as Karen and Mariam. The seed also includes orders waiting for review, completed
orders with feedback, and a blocked account to demonstrate access restrictions.

## Commands and validation

All commands below run from the repository root.

| Command | Purpose |
|---|---|
| `npm --prefix frontend run dev` | Start the Vite development server |
| `npm --prefix frontend run typecheck` | Run TypeScript checks without emitting files |
| `npm --prefix frontend run build` | Type-check and create the production build in `frontend/dist` |
| `npm --prefix frontend run preview` | Serve the frontend build locally, normally on port `4173` |
| `npm --prefix backend run dev` | Start the API with nodemon |
| `npm --prefix backend start` | Start the API without the development watcher |
| `npm --prefix backend run seed` | Create missing demo data |

When using frontend preview, include `http://localhost:4173` in the backend's
`CLIENT_URL` allowlist and restart the API. Preview still requires the backend.

Local integration checks have covered the order lifecycle, proposal ownership
and duplicates, actual WebSocket messages and history recovery, mutual reviews,
profile/avatar updates, administrator actions and access restrictions. The
recorded scope is in [the development plan](docs/PLAN.md). There is currently no
committed automated test suite or lint script.

## Deployment considerations

- Build `frontend/` with its deployment-specific `VITE_API_URL`; Vite variables
  are embedded at build time. Configure the static host to serve `index.html`
  for application routes such as `/orders/1`.
- Run `backend/` as a persistent Node.js service with `npm start`, its environment
  variables and a PostgreSQL connection. The service must support WebSocket
  upgrades at `/socket.io` on the same server as the API.
- Set `CLIENT_URL` to the exact frontend origin and use HTTPS/WSS when deployed.
  The backend reads the platform's `PORT` environment variable.
- `NODE_ENV=production` enables database TLS and disables automatic table
  alteration. Production startup creates missing tables with `sync()`, but
  existing-schema changes require a separate plan until migrations are added.
- Chat currently uses an in-memory Socket.IO adapter and in-process events.
  Multiple backend instances require a shared adapter and event delivery.

## Documentation

| Document | Contents |
|---|---|
| [API overview](docs/API.md) | Endpoints, roles, payloads, errors and chat events |
| [OpenAPI specification](backend/openapi.yaml) | Detailed machine-readable REST contract, served in Swagger UI |
| [Database model](docs/DB.md) | Entities, relationships and constraints |
| [Backend guide](docs/BACKEND.md) | Setup and an explanation of the server architecture |
| [Design guide](docs/DESIGN.md) | Theme, interface patterns and component reference |
| [Development plan](docs/PLAN.md) | Scope, integration-check record and remaining work |

## Future work

- Public deployment and a final responsive-layout/accessibility walkthrough.
- Automated unit, integration and browser tests, plus CI checks.
- Versioned database migrations.
- Authentication hardening, including rate limiting and a review of session storage.
- Email verification, password recovery and email notifications.
- General chat attachments; profile avatar uploads are already supported.
- Payments and escrow.
- A shared real-time adapter and event infrastructure for multiple API instances.

## License

Released under the [MIT License](LICENSE).

Copyright © 2026 [Sergey Israelyan](https://github.com/Spec12333).
