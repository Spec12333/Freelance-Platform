# Development Plan

Agreed scope: a freelance marketplace where a client posts an order, freelancers
send proposals, the client picks one, and both sides review each other after the
work is done. The project is a portfolio piece for a **frontend interview**, so
the frontend is what gets evaluated.

## Status (2026-10-23)

**Backend: complete.** Every endpoint in `docs/API.md` is implemented, documented
in Swagger (`http://localhost:4000/api/docs`) and checked end to end, including
the negative cases: second proposal, someone else's order, skipped status,
review on an unfinished order, someone else's chat, blocked user with a live
token, two concurrent accepts on one order. `npm run seed -- --fresh` gives demo
data for every screen.

**Frontend: started.** Types in `frontend/src/types/` match the contract; the
rest of `frontend/src` is placeholders.

The original plan alternated backend and frontend day by day. With the backend
done, the whole remaining budget goes to the frontend.

## Working rules

- One screen at a time, end to end: hook → page → loading / empty / error states
  → manual check with a demo account → commit.
- Branches: `main` always runs, features live in `feat/orders`-style branches.
  Small commits, written in English.
- When the UI needs something the API does not give, ask for an endpoint change
  instead of working around it — the contract, Swagger and the types are updated
  together.

## Stage 1 — Foundation

**Skeleton.** `api/client.ts` (axios, token interceptor, logout on 401 — not on
403), `store/auth.ts` (Zustand + persist), `QueryClientProvider`, router,
`ProtectedRoute`, Login and Register pages. On start, call `/auth/me` once and
show a spinner until it answers, so a reload does not flash the login page.

**Navigation and styles.** Role-aware navbar, layout, base UI kit (`Button`,
`Input`, `Select`, `Spinner`, `ErrorMessage`, `EmptyState`).
**Decide now: CSS modules or Tailwind — and do not change it later.**

*Checkpoint 1:* register → login → reload → still logged in; log in as
`blocked@freelancehub.dev` → a readable "account blocked" message.

## Stage 2 — Core scenario

This is the heart of the demo. Spend the most effort here.

**Orders list.** `useOrders` with TanStack Query, `OrderCard`, `StatusBadge`,
`Pagination`. Filters (category, status, budget, search) live in the URL via
`useSearchParams`, so a filtered list can be shared as a link — this demos well.
Loading / empty / error states from the start, not later.

**Order page and forms.** `OrderDetails`, `CreateOrder`, `EditOrder` (author
only, `OPEN` only — hide the button otherwise). Show field errors from the
server's `details[]`.

**Proposals.** `ProposalForm` for freelancers (hide it when
`GET /proposals/my?orderId=` says you already applied), the proposal list for
the client with new ones highlighted, the unseen counter in the navbar.

**Accepting and statuses.** "Choose freelancer" with a confirmation modal;
after it succeeds, invalidate the order and the proposal list. `OrderActions`:
one button derived from role + current status (see the transition table in
`docs/API.md`).

*Checkpoint 2:* the full flow in two browsers (or a normal and a private
window) — Karen creates an order → Anna sends a proposal → Karen accepts → Anna
sends it to review → Karen completes it. **If this does not work, stop and finish
it before moving on.**

## Stage 3 — Remaining features

**Freelancers.** Directory with skill / rate filters and sorting, public profile
with reviews, `MyProfile` edit form.

**Reviews.** `StarRating` (read-only and input), `ReviewForm` shown only when the
order is `COMPLETED`, you are a participant and have not reviewed yet.

**Chat.** `MessageList` + `MessageInput`, `refetchInterval: 5000`, own messages
on one side, auto-scroll to the bottom. Polling is a deliberate MVP choice;
sockets are future work.

**Dashboard.** Three views switched on `role`, with the counters and recent /
active orders.

**Admin.** Users table with block / unblock, categories with create / rename /
delete (disable delete when `ordersCount > 0`).

## Stage 4 — Polish and delivery

**States and errors.** Walk every screen: loading, empty, error, 403 and 404
pages, disabled buttons while a mutation runs, the server's message instead of
"Something went wrong".

**Responsive layout and accessibility.** Phone width, keyboard navigation,
labels on inputs, focus management in modals.

**Deployment.** Neon (Postgres) + Render (backend) + Vercel (frontend). Budget a
full day — CORS, environment variables and SSL always take longer than expected.
Run the seed against the production database.

**README.** Description, stack, screenshots, setup, demo accounts, "Future work"
(migrations, sockets, payments, email, file uploads, tests).

**Rehearsal.** A timed walk through the demo flow with the seed accounts.

## What to cut if you fall behind

1. Chat.
2. Admin user management — keep categories only.
3. Freelancer directory filters — keep the plain list.

**Never cut:** the order flow from Checkpoint 2, the loading / empty / error
states, and the readable error messages. That is what the interview will look at.
