# API Contract

Base URL: `http://localhost:4000/api` (frontend reads it from `VITE_API_URL`).

**Interactive reference: <http://localhost:4000/api/docs>** — every field, every
error, examples with seed ids, and a *Try it out* button. It is generated from
[`backend/openapi.yaml`](../backend/openapi.yaml); the raw spec is served at
`/api/openapi.json`. This file is the short map; both describe the same contract.

How the backend works inside is explained in [`BACKEND.md`](BACKEND.md).

If the implementation and the contract disagree, the implementation is wrong —
report it instead of adapting the UI.

## Conventions

**Auth.** Protected endpoints expect `Authorization: Bearer <token>`. The token
comes from `/auth/register` or `/auth/login`, holds `{ id, role }` and lives 7 days.
`isBlocked` is checked on every request, so a blocked user's existing token stops
working immediately.

**Lists** use one envelope and accept `page` (default 1) and `limit` (default 10,
max 50):

```json
{ "items": [], "total": 13, "page": 1, "pages": 2 }
```

Three lists are plain arrays instead, because they are always short:
`GET /categories`, `GET /orders/:id/proposals`, `GET /orders/:id/reviews`.

**Errors** always look like this; validation adds a field list:

```json
{ "message": "Validation failed", "details": [{ "field": "price", "message": "\"price\" must be greater than or equal to 1" }] }
```

| Code | When |
|---|---|
| 200 / 201 | OK / created |
| 204 | Deleted, no body |
| 400 | Validation failed (Joi) |
| 401 | Missing, malformed or expired token |
| 403 | Wrong role, not yours, or the account is blocked |
| 404 | Resource does not exist |
| 409 | A business rule refused it: wrong status, second proposal, second review, name taken |

**Data.** Money (`budget`, `price`, `hourlyRate`) is an integer. Dates are ISO
8601 strings in UTC. Nullable fields are sent as `null`, never omitted.

## Shared objects

The same shapes come back from every endpoint; `frontend/src/types/models.ts`
mirrors them.

`User` — a public profile. No `email`: only the owner (`/auth/me`, login,
register, profile update) and the admin get it.

```json
{
  "id": 4, "name": "Anna Hakobyan", "role": "FREELANCER",
  "bio": "Frontend developer...", "skills": ["react", "typescript", "css"],
  "hourlyRate": 20, "portfolioUrl": "https://example.com/anna", "avatarUrl": null,
  "rating": 4.5, "reviewsCount": 2, "isBlocked": false,
  "createdAt": "2026-10-23T10:00:00.000Z"
}
```

`rating` is the average of the reviews where this user is the target, one
decimal, `null` until the first review. It is computed, not stored.

`Order` — always with its relations, whichever endpoint returns it:

```json
{
  "id": 1, "title": "Landing page for an online store", "description": "...",
  "budget": 300, "deadline": "2026-11-06T10:00:00.000Z", "status": "OPEN",
  "clientId": 2, "freelancerId": null, "categoryId": 1,
  "client": { "id": 2, "name": "Karen Petrosyan", "rating": 5 },
  "freelancer": null,
  "category": { "id": 1, "name": "Web Development", "slug": "web-development" },
  "proposalsCount": 3,
  "createdAt": "2026-10-21T10:00:00.000Z"
}
```

Nested users are trimmed per context and never carry an email:

| Where | Shape |
|---|---|
| `order.client`, `order.freelancer` | `{ id, name, rating }` |
| `proposal.freelancer` | `{ id, name, rating, reviewsCount }` |
| `message.sender`, `review.author` | `{ id, name, avatarUrl }` |

`Proposal`: `{ id, orderId, freelancerId, price, coverLetter, status, viewedByClient, freelancer, createdAt }`

`Message`: `{ id, orderId, senderId, body, sender, createdAt }`

`Review`: `{ id, orderId, authorId, targetId, rating, comment, author, createdAt }`

## Auth

| Method | Path | Access | Body → result |
|---|---|---|---|
| POST | `/auth/register` | public | `email`, `password` (6-72), `name` (2-60), `role` (`CLIENT`/`FREELANCER`) → 201 `{ token, user }` |
| POST | `/auth/login` | public | `email`, `password` → 200 `{ token, user }`. 401 wrong credentials, 403 blocked |
| GET | `/auth/me` | any authenticated | → `user` (with email) |

`ADMIN` cannot be registered. The email is lowercased.

## Categories

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | public | Plain array `{ id, name, slug }`, sorted by name |

## Orders

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders` | public | Newest first. Filters below |
| POST | `/orders` | CLIENT | `title` (5-120), `description` (20-5000), `budget`, `categoryId`, optional `deadline` (future) → 201 `order` |
| GET | `/orders/:id` | public | 404 if missing |
| PATCH | `/orders/:id` | CLIENT, author, `OPEN` only | Any subset of the create fields; `deadline: null` removes it. 403 not the author, 409 not `OPEN` |
| PATCH | `/orders/:id/status` | depends on the move | `{ "status": "REVIEW" }` → `order` |

Filters for `GET /orders`, all optional: `categoryId`, `status`, `minBudget`,
`maxBudget`, `search` (case-insensitive, in the title), `clientId` ("my orders"),
`freelancerId` ("my work"), `page`, `limit`.

### Status flow

```
OPEN --(client accepts a proposal)--> IN_PROGRESS --(freelancer)--> REVIEW --(client)--> COMPLETED
  |                                        |
  +----------(client cancels)--------------+--> CANCELLED
```

| From | To | Who |
|---|---|---|
| `IN_PROGRESS` | `REVIEW` | the assigned freelancer |
| `REVIEW` | `COMPLETED` | the order's client |
| `OPEN`, `IN_PROGRESS` | `CANCELLED` | the order's client |

`OPEN → IN_PROGRESS` only happens through `POST /proposals/:id/accept`. Any other
move returns 409 naming the current status; a legal move by the wrong side, or a
call by a non-participant, returns 403. Cancelling an `OPEN` order rejects its
pending proposals. `COMPLETED` and `CANCELLED` are final.

## Proposals

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders/:id/proposals` | the order's CLIENT | Plain array, oldest first. 403 for anyone else |
| POST | `/orders/:id/proposals` | FREELANCER | `price`, `coverLetter` (20-3000) → 201 `proposal`. 409 order not `OPEN`, 409 already sent |
| GET | `/proposals/my` | FREELANCER | My proposals, newest first, each with `order: { id, title, status, budget, deadline }`. Filters `status`, `orderId` |
| POST | `/proposals/:id/accept` | the order's CLIENT | → `{ order, proposal }`. 409 order not `OPEN` or proposal already processed |

**Viewed flag.** `GET /orders/:id/proposals` marks every proposal of the order as
viewed, but the response still shows `viewedByClient` as it was *before* the
call — highlight the `false` ones as new. The dashboard counter drops at the
same moment.

**"Have I applied?"** `GET /proposals/my?orderId=5` returns `total: 0` or `1`.

**Accept** is one transaction: the chosen proposal becomes `ACCEPTED`, the other
pending ones `REJECTED`, the order `IN_PROGRESS` with `freelancerId` set.
Concurrent accepts on one order are serialized; only one wins.

## Messages

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders/:id/messages` | the order's client and assigned freelancer | Paginated, see below |
| POST | `/orders/:id/messages` | same two | `body` (1-2000) → 201 `message`. 409 while no freelancer is assigned |

**Page 1 holds the most recent messages; inside a page they are in chronological
order.** Render a page as it comes (newest at the bottom), poll page 1 every 5
seconds for new messages, request page 2 for older history. 403 for everyone
else, including freelancers whose proposals were rejected. On an order with no
freelancer the list is empty.

## Reviews

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/orders/:id/review` | the order's client or assigned freelancer | `rating` (1-5), optional `comment` (max 500) → 201 `review` |
| GET | `/orders/:id/reviews` | public | Plain array, at most two (one per side) |
| GET | `/freelancers/:id/reviews` | public | Paginated reviews about a user, newest first |

`targetId` is always the other side of the order and is set by the server — a
`targetId` in the body is ignored. Rejects: 403 not a participant, 409 order not
`COMPLETED`, 409 already reviewed.

**Show the review form?** Only when the order is `COMPLETED`, you are a
participant, and no review in `GET /orders/:id/reviews` has your `authorId`.

## Freelancers

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/freelancers` | public | Paginated, blocked excluded. Filters `search` (name), `skill`, `minRate`, `maxRate`, `sort` (`rating` default — best first, unrated last; `rate` — cheapest first) |
| GET | `/freelancers/:id` | public | `User` + `reviews` (latest 5). Works for any user, clients included |
| PATCH | `/freelancers/me` | FREELANCER | Any of `bio`, `skills`, `hourlyRate`, `portfolioUrl`, `avatarUrl` → `user` (with email). `null` or `""` clears a field; skills are lowercased |

## Dashboard

`GET /dashboard`, any authenticated user. The payload depends on the role and is
tagged with `role`. Count objects always contain every key, zeros included.

```json
{ "role": "CLIENT",
  "orders": { "OPEN": 3, "IN_PROGRESS": 1, "REVIEW": 1, "COMPLETED": 1, "CANCELLED": 1 },
  "recentOrders": [/* latest 5 Order */],
  "unseenProposals": 3 }
```

```json
{ "role": "FREELANCER",
  "proposals": { "PENDING": 1, "ACCEPTED": 4, "REJECTED": 1 },
  "activeOrders": [/* my IN_PROGRESS and REVIEW orders */],
  "rating": 4.5, "reviewsCount": 2 }
```

```json
{ "role": "ADMIN",
  "users": { "CLIENT": 2, "FREELANCER": 4, "ADMIN": 1 },
  "blockedUsers": 1,
  "orders": { "OPEN": 5, "IN_PROGRESS": 2, "REVIEW": 1, "COMPLETED": 4, "CANCELLED": 1 },
  "categories": 8 }
```

`unseenProposals` counts pending proposals on your orders with
`viewedByClient = false` — the notification badge, no sockets needed.

## Admin

Everything behind `auth` + `requireRole('ADMIN')`; otherwise 403.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | Paginated, by id, with emails. Filters `role`, `search` (name or email), `isBlocked` |
| PATCH | `/admin/users/:id/block` | `{ "isBlocked": true }` → `user`. 409 for yourself |
| GET | `/admin/categories` | Paginated, with `ordersCount` |
| POST | `/admin/categories` | `name` → 201. Slug generated from the name. 409 if name or slug is taken, 400 if the name has no Latin letters or digits |
| PATCH | `/admin/categories/:id` | `name` → 200, slug follows |
| DELETE | `/admin/categories/:id` | 204. 409 while any order uses it |

## Demo data (`npm run seed -- --fresh`)

| Role | Email | Password | Has |
|---|---|---|---|
| ADMIN | `admin@freelancehub.dev` | `admin123` | |
| CLIENT | `client@freelancehub.dev` | `client123` | Karen: 7 orders in every status, 3 unseen proposals |
| CLIENT | `lilit@freelancehub.dev` | `lilit123` | 6 orders, one pending proposal |
| FREELANCER | `anna@freelancehub.dev` | `anna123` | rating 4.5, one order in progress, one in review |
| FREELANCER | `davit@freelancehub.dev` | `davit123` | rating 4 |
| FREELANCER | `mariam@freelancehub.dev` | `mariam123` | rating 5, active chat on order 4, can still review order 13 |
| FREELANCER | `blocked@freelancehub.dev` | `blocked123` | blocked: login returns 403 |

Handy ids: order **1** has unseen proposals, proposal **2** is Anna's on it
(accept it as Karen); order **4** has a chat; order **5** is in `REVIEW`; order
**13** is `COMPLETED` and waiting for Mariam's review.
