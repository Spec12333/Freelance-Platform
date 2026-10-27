// Transport types mirroring docs/API.md.
//
// models.ts answers "what is an Order". This file answers "what travels over
// HTTP": the envelopes every list shares, the error body, the request payloads
// (which are not entities - you do not send an id or a status when creating an
// order), the query strings of the filters, and the handful of responses that
// are not a plain entity.
//
// The dependency runs one way only: api.ts imports from models.ts, never back.

import type {
  Category,
  CurrentUser,
  Order,
  OrderStatus,
  Proposal,
  ProposalStatus,
  Role,
} from "./models";

// --- Envelopes ---------------------------------------------------------------

// Every paginated list uses this one wrapper, which is why it is generic:
// Paginated<Order>, Paginated<Message>, Paginated<User>. Written once, reused
// by every list screen.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pages: number;
};

// Every error response, from a 400 to a 500, has this shape. `details` is added
// only by Joi validation failures, so a form can map server messages onto its
// own fields instead of printing one generic line.
export type ApiErrorBody = {
  message: string;
  details?: { field: string; message: string }[];
};

// --- Auth --------------------------------------------------------------------

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string; // min 6 characters, enforced again by the server
  name: string; // min 2 characters
  // Derived from Role instead of being retyped: the API refuses to create an
  // ADMIN through registration, and this makes that rule impossible to forget
  // when building the role selector.
  role: Exclude<Role, "ADMIN">;
};

// Returned by both /auth/register and /auth/login. The token goes to the auth
// store, the user is the profile of its owner, hence CurrentUser with an email.
export type AuthResponse = {
  token: string;
  user: CurrentUser;
};

// --- Orders ------------------------------------------------------------------

// Only the fields the client is allowed to set. No id, no status, no clientId -
// the server fills those in, which is precisely why this is not an Order.
export type CreateOrderBody = {
  title: string;
  description: string;
  budget: number;
  deadline?: string | null; // ISO 8601, must be in the future; null = no deadline
  categoryId: number;
};

// PATCH /orders/:id accepts any subset of the create fields, so the type is
// derived rather than copied: change CreateOrderBody and this follows.
export type UpdateOrderBody = Partial<CreateOrderBody>;

// PATCH /orders/:id/status. Which values are legal depends on the current
// status and on who is asking - the transition table lives on the server and
// is checked there; TypeScript can only promise that a valid status is sent.
export type UpdateOrderStatusBody = {
  status: OrderStatus;
};

// --- Proposals ---------------------------------------------------------------

export type CreateProposalBody = {
  price: number;
  coverLetter: string;
};

// POST /proposals/:id/accept changes two entities inside one transaction, so it
// returns both: the accepted proposal and the order that is now IN_PROGRESS.
export type AcceptProposalResponse = {
  order: Order;
  proposal: Proposal;
};

// --- Messages and reviews ----------------------------------------------------

export type CreateMessageBody = {
  body: string;
};

// targetId is absent on purpose: the server works out who is being reviewed
// from the order, so a client cannot post a review about an arbitrary user.
export type CreateReviewBody = {
  rating: number; // 1-5
  comment?: string | null; // max 500 characters
};

// --- Profile and admin -------------------------------------------------------

// PATCH /freelancers/me - every field is optional because the profile form may
// submit only what changed. null (or an empty string) clears a field.
export type UpdateProfileBody = {
  bio?: string | null;
  skills?: string[];
  hourlyRate?: number | null;
  portfolioUrl?: string | null;
  avatarUrl?: string | null;
};

export type BlockUserBody = {
  isBlocked: boolean;
};

export type CategoryBody = {
  name: string; // the slug is generated from it on the server
};

// --- Query parameters --------------------------------------------------------

// Filters are all optional by definition - an absent filter means "no filter".
// These objects are handed straight to axios as `params` and are the same shape
// the URL carries through useSearchParams, so a filtered list stays shareable.

export type PaginationParams = {
  page?: number;
  limit?: number; // defaults to 10 on the server, capped at 50
};

export type OrderFilters = PaginationParams & {
  categoryId?: number;
  status?: OrderStatus;
  minBudget?: number;
  maxBudget?: number;
  search?: string; // case-insensitive match on the title
  clientId?: number; // "my orders" for a client
  freelancerId?: number; // "my work" for a freelancer
};

export type FreelancerFilters = PaginationParams & {
  search?: string; // matches the name
  skill?: string;
  minRate?: number;
  maxRate?: number;
  sort?: "rating" | "rate";
};

// GET /proposals/my. With orderId the answer is "have I applied?": total 0 or 1.
export type MyProposalsFilters = PaginationParams & {
  status?: ProposalStatus;
  orderId?: number;
};

export type AdminUserFilters = PaginationParams & {
  role?: Role;
  search?: string;
  isBlocked?: boolean;
};

// GET /admin/categories returns categories with a usage count, which is what
// makes the delete button safe to show: a category in use cannot be deleted.
export type CategoryWithCount = Category & {
  ordersCount: number;
};

// The admin sees emails, so the list holds the private shape.
export type AdminUsersResponse = Paginated<CurrentUser>;

// --- Dashboard ---------------------------------------------------------------

// GET /dashboard answers differently per role, so this is a discriminated union
// with `role` as the tag. After `if (data.role === "CLIENT")` the compiler knows
// which half it is holding, so a client widget cannot be fed freelancer data.

export type ClientDashboard = {
  role: "CLIENT";
  orders: Record<OrderStatus, number>; // how many orders sit in each status
  recentOrders: Order[];
  unseenProposals: number; // proposals with viewedByClient === false
};

export type FreelancerDashboard = {
  role: "FREELANCER";
  proposals: Record<ProposalStatus, number>; // proposals have their own statuses
  activeOrders: Order[];
  rating: number | null;
  reviewsCount: number;
};

export type AdminDashboard = {
  role: "ADMIN";
  users: Record<Role, number>;
  blockedUsers: number;
  orders: Record<OrderStatus, number>;
  categories: number;
};

// A `switch (data.role)` over this union that misses a case is caught by the
// compiler when the result is assigned to `never` in the default branch.
export type DashboardResponse = ClientDashboard | FreelancerDashboard | AdminDashboard;
