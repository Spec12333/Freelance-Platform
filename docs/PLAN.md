# Development Plan (18 days + 2 buffer)

Agreed scope: a freelance marketplace where a client posts an order, freelancers
send proposals, the client picks one, and both sides review each other after the
work is done.

## Working rule: vertical slices

Never "the whole backend first, then the whole frontend". Each day closes one
feature end to end: table → service → route → screen → manual check in the
browser → commit. That way there is a working demo on any given day.

Branches: `main` always runs, features live in `feat/orders`-style branches and
are merged at the end of the day. Small commits, written in English.

Division of labor for this project: the backend is built for you; you write the
frontend on top of `docs/API.md`.

## Stage 1 — Foundation (days 1-4)

**Day 1. Backend skeleton and database.** Dependencies, `.env`, local Postgres,
all six models and associations, `sequelize.sync({ alter: true })` on startup,
`seed.js` with categories and demo users.
*Done when:* `npm run seed` finishes and the tables contain data.

**Day 2. Authentication.** `register` / `login` / `me`, bcrypt, JWT. Middleware:
`auth`, `requireRole`, `validate`, `errorHandler`. Joi schemas for auth.
*Done when:* all three endpoints work in Postman and a bad token returns 401,
and `passwordHash` appears in no response.

**Day 3. Frontend skeleton.** Vite + TypeScript, routing, axios instance with interceptors
(attach token, log out on 401), Zustand auth store persisted to localStorage,
`ProtectedRoute`, Login and Register pages, `QueryClientProvider`.
*Done when:* the register form actually creates a user in the database.

**Day 4. Navigation and end-to-end check.** Role-aware navbar, redirects, base
styles. **Decide now: CSS modules or Tailwind — and do not change it later.**
*Checkpoint 1:* register → login → reload the page → still logged in.

## Stage 2 — Core scenario (days 5-10)

This is the heart of the project and what gets examined at the defense. Spend the
most effort here.

**Day 5. Orders: backend.** `POST /orders` (CLIENT only), `GET /orders` (no
filters yet), `GET /orders/:id` with client and category included,
`PATCH /orders/:id` with owner and `OPEN`-status checks.

**Day 6. Orders: frontend.** `useOrders` hook, Orders / OrderDetails /
CreateOrder pages, `OrderCard`. Loading / empty / error states on every list from
the start, not later.

**Day 7. Search, filters, pagination.** Backend: `categoryId`, `minBudget`,
`maxBudget`, `status`, `search` (`Op.iLike` on title), `page`. Frontend: filter
state lives in the URL via `useSearchParams`, not `useState` — then a filtered
list can be shared as a link, which demos well.

**Day 8. Proposals.** `POST /orders/:id/proposals` with every check: FREELANCER
only, `OPEN` only, not your own order, not twice (catch the unique violation and
return a readable 409). `GET /orders/:id/proposals` for the order owner only.
Frontend: proposal form and the proposal list for the client.

**Day 9. Choosing a freelancer — the transaction.** `POST /proposals/:id/accept`:
in one `sequelize.transaction`, the chosen proposal becomes `ACCEPTED`, the rest
become `REJECTED`, and the order moves to `IN_PROGRESS` with `freelancerId` set.
This is the key piece of code in the project and the one you will be asked about
— write it carefully and comment it.

**Day 10. Order statuses.** `PATCH /orders/:id/status` with a strict transition
check. Keep the allowed transitions in one map in the service, not in `if`
chains. Frontend: one action button derived from role + current status.
*Checkpoint 2:* the full flow in the browser with two users — client creates an
order → freelancer sends a proposal → client accepts → freelancer sends it to
review → client completes it. **If this does not work by the end of day 10, stop
and finish it before moving on.**

## Stage 3 — Remaining features (days 11-15)

**Day 11. Freelancer profiles.** `GET /freelancers` with the rating aggregate,
`GET /freelancers/:id`, `PATCH /freelancers/me`. Freelancers and
FreelancerProfile pages.

**Day 12. Reviews.** `POST /orders/:id/review` — `COMPLETED` only, participants
only, once. `StarRating` component, reviews on the profile page.

**Day 13. Messages.** `GET`/`POST /orders/:id/messages`, access limited to the
client and the assigned freelancer. Frontend: `refetchInterval: 5000` in TanStack
Query. Write in the README that polling is a deliberate MVP choice and sockets
are future work.

**Day 14. Dashboard.** `GET /dashboard`: my orders, my proposals, unseen-proposal
counter. Different view per role.

**Day 15. Admin panel.** Categories (CRUD) and users (list, block/unblock).
No frills — a table and buttons.

## Stage 4 — Hardening and delivery (days 16-20)

**Day 16. Validation and errors.** Walk every route: is Joi applied, is ownership
checked, does every error go through `errorHandler`. 403/404 pages. Verify the
frontend shows the server message, not a generic "Something went wrong".

**Day 17. Deployment.** Render (backend + Postgres), Vercel (frontend). Budget a
full day — CORS, environment variables and `sslmode` always eat more time than
expected. Run the seed against the production database.

**Day 18. Testing and bug fixing.** Walk 10-12 scenarios by hand, including the
negative ones: a second proposal, a review on an unfinished order, editing
someone else's order, skipping a status, reading someone else's chat. Each
attempt must produce a readable error — that is exactly what the spec promises.

**Day 19. README and materials.** Description, stack, database schema, endpoint
table, screenshots, setup instructions, a "Future work" section (sequelize-cli
migrations, sockets, payments, email, file uploads).

**Day 20. Presentation and buffer.** Demo accounts with meaningful data (not
"test1 / test2"), a timed rehearsal of the demo, and room for whatever breaks.

## What to cut if you fall behind

Being 2-3 days behind is almost inevitable. Decide the order of sacrifice now:

1. Messages (day 13) — most expensive, least essential.
2. Admin user management — keep categories only.
3. Pagination — replace with `limit: 50`.

**Never cut:** the accept-proposal transaction, the status chain, the uniqueness
of proposals and reviews. Those are the "the system does not allow incorrect
actions" part the project exists to demonstrate.
