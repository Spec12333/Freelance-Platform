// Domain types mirroring the "Shared objects" section of docs/API.md.
//
// These describe what the API *sends*, not what Postgres stores. A column that
// never leaves the server (passwordHash) has no place here; a value the server
// computes and the database does not hold (rating) does. docs/DB.md explains
// where the data lives, docs/API.md says what arrives over HTTP - and the wire
// format is what the UI actually has to render.
//
// These types vanish at build time. They are checked while the code is written
// and compiled, never while it runs: nothing here validates a response. The
// server guarantees the shape (Joi on every request), this file just lets the
// compiler hold us to the same contract on the client side.

export type Role = "CLIENT" | "FREELANCER" | "ADMIN";

export type OrderStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// Nested users are trimmed down to what each screen needs, so the shape differs
// by context. Three narrow types instead of one wide one: widening them would
// promise fields that are simply not in the response, which is exactly the kind
// of lie these files exist to prevent.

// order.client, order.freelancer
export type UserSummary = {
  id: number;
  name: string;
  rating: number | null;
};

// proposal.freelancer - the proposal list shows a rating with its sample size
export type UserBadge = UserSummary & {
  reviewsCount: number;
};

// message.sender, review.author - these are rendered as an avatar plus a name
export type UserRef = {
  id: number;
  name: string;
  avatarUrl: string | null;
};

// Public profile, as returned by GET /freelancers/:id and nested elsewhere.
// `email` is deliberately missing: the API exposes it only to its owner.
export type User = {
  id: number;
  name: string;
  role: Role;
  bio: string | null;
  skills: string[]; // never null - the column defaults to an empty array
  hourlyRate: number | null; // whole currency units
  portfolioUrl: string | null;
  avatarUrl: string | null;
  rating: number | null; // AVG of received reviews, null until the first one
  reviewsCount: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string; // last change of the row; equals createdAt until the first update
};

// The signed-in user: GET /auth/me and the `user` field of an auth response.
// Same profile plus the email, which you are allowed to see for yourself.
export type CurrentUser = User & {
  email: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Order = {
  id: number;
  title: string;
  description: string;
  budget: number; // integer in whole currency units, never a string
  deadline: string | null; // ISO 8601 UTC; build a Date from it at render time
  status: OrderStatus;
  clientId: number;
  freelancerId: number | null; // null until a proposal is accepted
  categoryId: number;
  // Resolved relations the list and detail screens need, so that rendering an
  // order never costs an extra request per row.
  client: UserSummary;
  freelancer: UserSummary | null;
  category: Category;
  proposalsCount: number; // the proposals themselves have their own endpoint
  createdAt: string;
  updatedAt: string; // last change of the row; equals createdAt until the first update
};

export type Proposal = {
  id: number;
  orderId: number;
  freelancerId: number;
  price: number;
  coverLetter: string;
  status: ProposalStatus;
  // false until the client opens the proposal list of this order; this flag is
  // what the dashboard counts as "unseen proposals". The list endpoint returns
  // the value from *before* that visit, so false means "new to you".
  viewedByClient: boolean;
  freelancer: UserBadge;
  createdAt: string;
  updatedAt: string; // last change of the row; equals createdAt until the first update
};

// The order nested in a freelancer's own proposal list (GET /proposals/my).
export type OrderSummary = Pick<Order, "id" | "title" | "status" | "budget" | "deadline">;

export type ProposalWithOrder = Proposal & {
  order: OrderSummary;
};

export type Review = {
  id: number;
  orderId: number;
  authorId: number;
  // Who is being rated. Resolved on the server as the other party of the order
  // and never sent by the client - see CreateReviewBody in api.ts.
  targetId: number;
  rating: number; // 1-5
  comment: string | null;
  author: UserRef;
  createdAt: string;
  updatedAt: string; // last change of the row; equals createdAt until the first update
};

// GET /freelancers/:id - a profile together with the latest reviews about it.
export type PublicProfile = User & {
  reviews: Review[];
};

export type Message = {
  id: number;
  orderId: number;
  senderId: number;
  body: string;
  sender: UserRef;
  createdAt: string;
  updatedAt: string; // last change of the row; equals createdAt until the first update
};
