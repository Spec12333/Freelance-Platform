# Data Model

PostgreSQL + Sequelize. Tables are created by `sequelize.sync({ alter: true })`
on startup — there are no migrations in the MVP (see "Future work" in the README).

Each model lives in its own file under `backend/src/models/` as a factory
`(sequelize) => sequelize.define(...)`. Every association is declared in
`models/index.js` so that all four `belongsTo(User)` aliases stay visible side by
side.

## User

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK, auto |
| email | STRING | unique, not null |
| passwordHash | STRING | not null, never serialized |
| name | STRING | not null |
| role | ENUM | `CLIENT`, `FREELANCER`, `ADMIN` |
| bio | TEXT | freelancer profile |
| skills | ARRAY(STRING) | Postgres array, used by the `skill` filter |
| hourlyRate | INTEGER | whole currency units |
| portfolioUrl | STRING | |
| avatarUrl | STRING | |
| isBlocked | BOOLEAN | default false, checked on every request |

`rating` is **not** a column — it is computed as `AVG(rating)` over reviews where
`targetId = user.id`. Storing it would mean keeping it in sync on every review.

## Category

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| name | STRING | unique, not null |
| slug | STRING | unique, generated from the name |

## Order

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| title | STRING | not null |
| description | TEXT | not null |
| budget | INTEGER | not null |
| deadline | DATE | |
| status | ENUM | `OPEN`, `IN_PROGRESS`, `REVIEW`, `COMPLETED`, `CANCELLED`, default `OPEN` |
| clientId | INTEGER | FK → User, not null |
| freelancerId | INTEGER | FK → User, nullable until a proposal is accepted |
| categoryId | INTEGER | FK → Category, not null |

## Proposal

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| orderId | INTEGER | FK → Order |
| freelancerId | INTEGER | FK → User |
| price | INTEGER | not null |
| coverLetter | TEXT | not null |
| status | ENUM | `PENDING`, `ACCEPTED`, `REJECTED`, default `PENDING` |
| viewedByClient | BOOLEAN | default false — drives the notification counter |

**Composite unique index `(orderId, freelancerId)`** — this is what enforces "one
proposal per order" at the database level. The service catches the unique
violation and turns it into a readable 409 instead of a 500.

## Review

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| orderId | INTEGER | FK → Order |
| authorId | INTEGER | FK → User, who wrote it |
| targetId | INTEGER | FK → User, who is being rated |
| rating | INTEGER | 1-5, not null |
| comment | TEXT | max 500 chars |

**Composite unique index `(orderId, authorId)`** — one review per author per
order. Both sides of an order can review each other, which is exactly why
`targetId` is needed: without it the freelancer's rating cannot be computed.

## Message

| Field | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| orderId | INTEGER | FK → Order |
| senderId | INTEGER | FK → User |
| body | TEXT | not null |

## Associations

```
User  1 ─── n  Order      as 'createdOrders'   (FK clientId)
Order n ─── 1  User       as 'client'
User  1 ─── n  Order      as 'assignedOrders'  (FK freelancerId)
Order n ─── 1  User       as 'freelancer'

Category 1 ─ n  Order                           (FK categoryId)
Order    n ─ 1  Category  as 'category'

Order 1 ─── n  Proposal   as 'proposals'        (FK orderId)
User  1 ─── n  Proposal                         (FK freelancerId)
Proposal n ─ 1 User       as 'freelancer'

Order 1 ─── n  Review     as 'reviews'          (FK orderId)
Review n ─ 1   User       as 'author'           (FK authorId)
Review n ─ 1   User       as 'target'           (FK targetId)

Order 1 ─── n  Message    as 'messages'         (FK orderId)
Message n ─ 1  User       as 'sender'           (FK senderId)
```

Four different `belongsTo(User)` aliases exist: `client`, `freelancer`, `author`,
`target`. Always pass `as` in an `include` — `include: { model: User }` without an
alias fails with an unhelpful Sequelize error.

## Invariants the database guarantees

These three are enforced by constraints, not only by service code, because they
are the core of the spec ("the system does not allow incorrect actions"):

1. One proposal per `(order, freelancer)` — unique index on Proposal.
2. One review per `(order, author)` — unique index on Review.
3. A unique email per user.

Everything else — status transitions, ownership, "COMPLETED only" for reviews —
is enforced in the service layer and must be covered by the negative test pass
on day 18.
