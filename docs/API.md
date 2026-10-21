# API Contract

Base URL: `http://localhost:4000/api` (frontend reads it from `VITE_API_URL`).

This file is the source of truth for the frontend. If an endpoint here and the
implementation disagree, the implementation is wrong — report it instead of
adapting the UI.

## Conventions

**Auth.** Every protected endpoint expects `Authorization: Bearer <token>`.
The token is returned by `/auth/register` and `/auth/login` and holds `{ id, role }`.

**List responses** always use the same envelope:

```json
{ "items": [], "total": 42, "page": 1, "pages": 5 }
```

Query params for every list: `page` (default 1), `limit` (default 10, max 50).

**Error responses** always use the same shape:

```json
{ "message": "Order can only be edited while it is open" }
```

Validation errors add a field list:

```json
{ "message": "Validation failed", "details": [{ "field": "price", "message": "must be a positive number" }] }
```

**Status codes**

| Code | When |
|---|---|
| 200 | OK |
| 201 | Resource created |
| 400 | Validation failed (Joi) |
| 401 | Missing, malformed or expired token |
| 403 | Wrong role, not the owner, or user is blocked |
| 404 | Resource does not exist |
| 409 | Rule conflict: second proposal on the same order, second review by the same author, category name taken |

**Dates** are ISO 8601 strings in UTC. **Money** (`budget`, `price`, `hourlyRate`)
is an integer in whole currency units — no decimals, no strings.

## Shared objects

`User` (public shape — `email` is returned only for yourself, `passwordHash` never):

```json
{
  "id": 7,
  "name": "Anna",
  "role": "FREELANCER",
  "avatarUrl": null,
  "bio": "React developer",
  "skills": ["react", "express"],
  "hourlyRate": 20,
  "portfolioUrl": "https://...",
  "rating": 4.5,
  "reviewsCount": 2,
  "isBlocked": false
}
```

`rating` is `AVG(rating)` of reviews where `targetId = user.id`, rounded to one
decimal, or `null` when there are no reviews yet.

`Order`:

```json
{
  "id": 3,
  "title": "Landing page",
  "description": "...",
  "budget": 300,
  "deadline": "2026-11-15T00:00:00.000Z",
  "status": "OPEN",
  "clientId": 2,
  "freelancerId": null,
  "categoryId": 1,
  "client": { "id": 2, "name": "Karen", "rating": null },
  "freelancer": null,
  "category": { "id": 1, "name": "Web Development", "slug": "web-development" },
  "proposalsCount": 4,
  "createdAt": "2026-10-21T10:00:00.000Z"
}
```

Nested `client`, `freelancer`, `category` are present on `GET /orders` and
`GET /orders/:id`. `proposalsCount` is present on both; `proposals` are never
inlined — they have their own endpoint with its own access rule.

## Auth

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | public | `email`, `password` (min 6), `name` (min 2), `role` (`CLIENT` or `FREELANCER`) | 201 `{ token, user }` |
| POST | `/auth/login` | public | `email`, `password` | 200 `{ token, user }` |
| GET | `/auth/me` | any authenticated | — | 200 `user` (with `email`) |

`ADMIN` cannot be created through `/auth/register` — the admin comes from the seed.
Login of a blocked user returns 403.

## Categories

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | public | Flat array, not paginated — it feeds the filter dropdown |

```json
[{ "id": 1, "name": "Web Development", "slug": "web-development" }]
```

## Orders

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders` | public | Filters below |
| POST | `/orders` | CLIENT | `title`, `description`, `budget`, `deadline`, `categoryId` → 201 `order` |
| GET | `/orders/:id` | public | 404 if missing |
| PATCH | `/orders/:id` | CLIENT, author only, status `OPEN` only | Any subset of the create fields. 403 if not the author, 409 if the status is no longer `OPEN` |
| PATCH | `/orders/:id/status` | depends on the transition | `{ "status": "REVIEW" }` |

Filters for `GET /orders`: `categoryId`, `status`, `minBudget`, `maxBudget`,
`search` (case-insensitive match on `title`), `page`, `limit`.
Example: `/orders?categoryId=1&status=OPEN&minBudget=100&search=landing&page=2`.

### Status flow

```
OPEN --(client accepts a proposal)--> IN_PROGRESS --(freelancer)--> REVIEW --(client)--> COMPLETED
  |                                        |
  +----------(client cancels)--------------+--> CANCELLED
```

| From | To | Who |
|---|---|---|
| `IN_PROGRESS` | `REVIEW` | assigned FREELANCER |
| `REVIEW` | `COMPLETED` | order CLIENT |
| `OPEN`, `IN_PROGRESS` | `CANCELLED` | order CLIENT |

`OPEN → IN_PROGRESS` is **not** available through this endpoint — it only happens
inside `POST /proposals/:id/accept`. Any other transition returns 409 with a
message naming the current status; a correct transition attempted by the wrong
role returns 403.

## Proposals

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders/:id/proposals` | order CLIENT only | 403 for anyone else, including other freelancers. **Side effect:** marks every proposal of this order as `viewedByClient: true` |
| POST | `/orders/:id/proposals` | FREELANCER | `price`, `coverLetter` → 201 `proposal` |
| POST | `/proposals/:id/accept` | order CLIENT | 200 `{ order, proposal }` |

`POST /orders/:id/proposals` rejects:

- 403 — role is not `FREELANCER`, or the order is your own
- 409 — order status is not `OPEN`
- 409 — you already sent a proposal for this order (composite unique index)

`POST /proposals/:id/accept` runs in a single transaction: the chosen proposal
becomes `ACCEPTED`, every other proposal of that order becomes `REJECTED`, and
the order moves to `IN_PROGRESS` with `freelancerId` set. 409 if the order is no
longer `OPEN` or the proposal was already processed.

`Proposal`:

```json
{
  "id": 11,
  "orderId": 3,
  "freelancerId": 7,
  "price": 250,
  "coverLetter": "...",
  "status": "PENDING",
  "viewedByClient": false,
  "freelancer": { "id": 7, "name": "Anna", "rating": 4.5, "reviewsCount": 2 },
  "createdAt": "2026-10-21T11:00:00.000Z"
}
```

## Messages

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/orders/:id/messages` | order CLIENT and assigned FREELANCER | Paginated, oldest first |
| POST | `/orders/:id/messages` | same two users | `body` → 201 `message` |

403 for everyone else, including a freelancer whose proposal was rejected.
Messages are available from `IN_PROGRESS` onward — on an `OPEN` order there is
no assigned freelancer yet, so `GET` returns an empty list and `POST` returns 409.

`Message`: `{ id, orderId, senderId, body, sender: { id, name, avatarUrl }, createdAt }`

## Reviews

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/orders/:id/review` | order CLIENT or assigned FREELANCER | `rating` (1-5), `comment` (optional, max 500) → 201 `review` |
| GET | `/freelancers/:id/reviews` | public | Reviews where `targetId = :id`; works for any user id, not only freelancers |

`targetId` is resolved on the server — it is the other party of the order and is
never accepted from the client. Rejects:

- 409 — order status is not `COMPLETED`
- 409 — you already reviewed this order (composite unique index)
- 403 — you are not a participant of this order

`Review`: `{ id, orderId, authorId, targetId, rating, comment, author: { id, name, avatarUrl }, createdAt }`

## Freelancers

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/freelancers` | public | Paginated list of `role = FREELANCER`, blocked users excluded. Filters: `search` (name), `skill`, `minRate`, `maxRate`, `sort` (`rating` or `rate`) |
| GET | `/freelancers/:id` | public | Public `User` + `reviews` (latest 5) |
| PATCH | `/freelancers/me` | FREELANCER | `bio`, `skills`, `hourlyRate`, `portfolioUrl`, `avatarUrl` → 200 `user` |

## Dashboard

| Method | Path | Access |
|---|---|---|
| GET | `/dashboard` | any authenticated |

CLIENT:

```json
{
  "role": "CLIENT",
  "orders": { "OPEN": 2, "IN_PROGRESS": 1, "REVIEW": 0, "COMPLETED": 4, "CANCELLED": 0 },
  "recentOrders": [],
  "unseenProposals": 3
}
```

FREELANCER:

```json
{
  "role": "FREELANCER",
  "proposals": { "PENDING": 3, "ACCEPTED": 1, "REJECTED": 5 },
  "activeOrders": [],
  "rating": 4.5,
  "reviewsCount": 2
}
```

`unseenProposals` is `COUNT(*)` of proposals where `viewedByClient = false` and
the order belongs to you. This is the notification counter from the spec — it
needs no sockets, and it drops to 0 when the client opens the proposal list.

## Admin

Everything below is behind `auth` + `requireRole('ADMIN')`; otherwise 403.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | Paginated. Filters: `role`, `search`, `isBlocked` |
| PATCH | `/admin/users/:id/block` | `{ "isBlocked": true }` → 200 `user`. Cannot block yourself (409) |
| GET | `/admin/categories` | Paginated, with `ordersCount` per category |
| POST | `/admin/categories` | `name` → 201. `slug` is generated from the name. 409 if the name is taken |
| PATCH | `/admin/categories/:id` | `name` → 200 |
| DELETE | `/admin/categories/:id` | 409 if any order still uses the category |

A blocked user keeps a valid token, so `middleware/auth.js` checks `isBlocked`
on every request and returns 403 — not only at login.

## Demo accounts (from `npm run seed`)

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@freelancehub.dev` | `admin123` |
| CLIENT | `client@freelancehub.dev` | `client123` |
| FREELANCER | `anna@freelancehub.dev` | `anna123` |
| FREELANCER | `davit@freelancehub.dev` | `davit123` |

The seed also creates categories and a few orders in different statuses, so every
screen has something to show without clicking through the whole flow by hand.
