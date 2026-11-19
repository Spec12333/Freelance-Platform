# Design Guide

One visual language for every screen. The reference is the Register page
(`frontend/src/pages/Register.tsx`). When a new screen needs something not
covered here, add it here first.

## Character

A confident marketplace inspired by Upwork: warm paper backgrounds, white
surfaces, charcoal text and a clear leaf green. Serif display headlines add
character; body text stays in Plus Jakarta Sans. Use forest panels and lime
accents sparingly for page introductions, with honest product content rather
than decorative statistics. Controls are pill-shaped, borders crisp and shadows
quiet. Keep the same visual language across auth, marketplace and workspace pages.

## Where the style lives

All of it is in `frontend/src/index.css`:

- `@theme` — tokens: the font, the `brand-*` green scale, two shadows.
- `@layer components` — shared classes for repeated UI (`.input`, `.btn`, …).
  Utilities written next to them win, so `className="input pl-11"` works.

Everything else is plain Tailwind utilities in the markup.

## Tokens

| Token | Use |
|---|---|
| `font-sans` — Plus Jakarta Sans | Body, controls and compact headings. Loaded in `index.html` |
| `font-display` — Georgia | Large page and editorial section headings |
| `paper`, `cream`, `ink`, `lime` | Warm canvas, tinted panels, charcoal and restrained accent |
| `brand-600` / hover `brand-700` | Primary buttons, links |
| `brand-50` + `brand-600` border | Selected state |
| `brand-950` | Dark brand surfaces (the auth side panel) |
| Tailwind `gray-*` | Text and borders: headings `900`, body `700`, secondary `500`, placeholders `400`, borders `200`/`300` |
| Tailwind `red-*` | Errors and destructive actions only |
| Tailwind `amber-*` | New highlights and waiting states; review stars use brand green |
| `shadow-card` | Resting cards |
| `shadow-float` | Things above the page: dropdowns, modals |

## Shared classes

| Class | What |
|---|---|
| `.card` | White rounded panel with a crisp warm border and quiet shadow. Add padding: `card p-5` |
| `.eyebrow`, `.page-title`, `.page-intro` | Shared small uppercase label, serif page heading and introduction panel |
| `.field-label` | Label above a field |
| `.input` | Text input and `<select>`. Red automatically when `aria-invalid` is true |
| `.input-icon` | Icon inside a field: wrap in `relative`, add `pl-11` to the input |
| `.field-error` / `.field-hint` | Text under a field |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-ghost` | Buttons. Sizes: `.btn-sm`, `.btn-lg` |
| `.badge` | Status pill; add colours from the table below |
| `.link` | Inline text link |
| `.alert-error` | Box for a server error message |

A field, as on Register:

```tsx
<div>
  <label htmlFor="order-title" className="field-label">Title</label>
  <input id="order-title" className="input" aria-invalid={errors.title ? true : undefined} {...register("title")} />
  {errors.title && <p className="field-error">{errors.title.message}</p>}
</div>
```

## Typography

| Element | Classes |
|---|---|
| Page title | `page-title`, or a larger `font-display` headline on a forest introduction |
| Section title | `text-xl font-bold text-gray-900` |
| Card title | `font-bold text-gray-900` |
| Body | `text-[15px] text-gray-700` |
| Secondary / meta | `text-sm text-gray-500` |

Money is always bold: `$300` in `font-bold text-gray-900`.

## Layout

- App background is `gray-50` (set on `body`); content sits on `.card`s.
- Page container: `mx-auto max-w-6xl px-5 sm:px-8 py-8`.
- Radius: `rounded-xl` for controls, `rounded-2xl` for cards, `rounded-full`
  for badges and avatars.
- Spacing: `space-y-5` inside forms, `space-y-8` between page sections.
- Mobile first: everything works at 375px; two columns start at `lg:`.
- Navigation uses a white sticky header with an underlined active section,
  round identity markers and pill actions. On phones, the menu scrolls in its
  own row. The shared footer closes every workspace page.
- Login/Register use a forest brand panel with a large serif headline and a
  warm canvas around the white form. Marketplace introductions use the same
  forest/lime palette. Unfinished sections have an honest Coming soon state
  with a working link to projects, without fabricated data or enabled fake controls.
- One primary button per view.
- The order marketplace uses a full-width white search panel with a prominent
  search action, labelled filter dropdowns, removable filter chips and a reset
  control. Keep the title and results count above the panel, separate from fields.
- Search fields use a soft gray surface, a visible green focus ring and an
  inset action button. Native select arrows are replaced with our chevron icon.
- Filters follow the same order in code and UI: search, status, category,
  budget, then pagination. Budget uses two dollar-prefixed fields and a separate
  Apply budget button; show validation below them and a removable applied-range chip.
- Avatars without an image: initials on `bg-brand-100 text-brand-800`.
- Order details use a wide description card and a narrower sidebar for the
  budget, project facts and client. Stack the cards on mobile, preserve line
  breaks in descriptions and keep a link to the orders list in every state.
- Order editing uses labelled fields grouped into project details, then budget
  and deadline. A compact sidebar shows the published project. Put Cancel and
  Save changes in the form footer; show field errors next to their controls.
- Order creation follows the same form layout, with empty fields, a brief-writing
  tips sidebar and a single Post project action. Keep loading, retry and empty
  category states inside the page container.
- Proposal forms sit below the project brief. Use a dollar-prefixed price field,
  a cover-letter textarea and one Send proposal action. Keep the submitted form
  as a success card and show API validation messages next to the fields.
- Client proposal cards show freelancer initials, a linked name, rating and
  review count, then the offered price, sent date and full cover letter. Unseen
  proposals use an amber New badge and border; status uses the shared badge.
- The order author sees proposals below the brief, with a total count, unseen
  count and a Refresh action. Keep the heading during loading, empty and error
  states. Viewing the list refreshes the client's unseen-proposal counter.
- Pending proposals on an open order have a Choose freelancer action. Confirm
  the freelancer and offered price in the shared modal. Lock all selection
  actions while accepting, then show the updated statuses and a success message.
- Project participants see a progress card at the top of the details sidebar,
  with the status, assigned freelancer and next step. Only the assigned freelancer
  can submit work for review; the client can complete reviewed work or cancel an
  open/in-progress project. Confirm transitions in the shared modal, keep errors
  inside it and lock actions while saving. Cancellation keeps the project history.
- Project chat sits below the brief and is private to the client and assigned
  freelancer. Before assignment, the client sees an explanation. Use green own
  messages on the right and white incoming messages on the left, with dates and
  local times. Scroll inside the conversation, preserve the reading position on
  incoming messages and offer a New messages shortcut. Socket.IO events refresh
  the latest page; Older/Newer pages keep their reading position. Show the live
  connection status without claiming the other participant is online. Rejoin and
  reload missed messages after reconnecting. Keep loaded
  messages on temporary failures, but hide them on access errors. Preserve drafts
  on send failures and clear only after saving; messages allow 1-2000 characters.
- Check the freelancer's existing proposal before showing the form. An existing
  proposal uses a read-only card with its price, status, sent date and letter,
  including when the order is no longer open. Show a spinner or retry card while
  the check is pending or has failed.
- A pending proposal on an open order has an Edit proposal action. Reuse the
  proposal form with prefilled values and Cancel / Save changes actions. Lock
  fields while saving and show the updated offer in its original card afterwards.
- Delete actions are red and visible only to the owner in an allowed status.
  Confirm permanent deletion in a native modal dialog with Cancel and Delete.
  Keep keyboard focus inside, restore it on close, and block dismissal while the
  request is pending. Keep errors inside the dialog so the user can retry.
- Completed projects have an editorial feedback section: a forest introduction,
  real review count, white divided review rows and a warm-tinted form. Green stars
  are native radio inputs in edit mode and an accessible fractional star display
  in read-only mode. Only a participant without a saved review sees the form,
  after a successful fresh check. Never average the two reviews: they rate two
  different people. Optional comments allow 500 characters; show errors inline
  and keep drafts on failure. Published reviews replace the form immediately.
- Public profiles use a forest cover, an overlapping circular avatar/initials,
  a large serif name and real rating/member-since details. Below, pair biography,
  skills and received reviews with a narrower rate/portfolio/action sidebar.
  Respect client/admin profile roles, missing fields and blocked-account states;
  do not invent availability or earned badges. Reuse the embedded five reviews
  for page one, then load review pages from the API with the page in the URL.
  Keep the profile visible if its review request fails and avoid showing another
  user's previous reviews during navigation. Portfolio links open in a new tab.
- The talent directory uses a forest/lime introduction and a real result count,
  followed by name search, exact skill and hourly-rate filters, then sorting.
  Name search waits 400 ms; skill/rate drafts apply together with a button. URL
  parameters preserve applied filters and page; invalid ranges stay editable and
  do not reach the API. Cards remain visible while new results load. Use a
  responsive one/two/three-column grid with real avatars/initials, ratings, short
  biographies, skill chips, rates and profile links. Do not invent availability,
  earned badges or direct-hire/chat actions. Show empty, error/retry and loading
  states inside the page, with a reset and removable applied-filter chips.

- Avatars use the shared `Avatar` component: photo or initials, a visible keyboard
  focus ring and a profile link. Resolve uploaded image paths against the API
  host. Inside an existing profile link, use the non-linked variant to avoid
  nested anchors. Reviews, proposals, project owners and chat senders follow the
  same behavior. Missing/broken images fall back to initials.
- Profile photo editing uses a labelled file input, circular local preview,
  Save photo / Cancel selection and Remove photo actions. Accept JPEG/PNG/WebP
  up to 5 MiB and 16 megapixels; show inline errors and pending/success feedback.
  Save photos independently from profile text and disable concurrent profile
  writes. Revoke browser preview URLs after replacing/removing drafts.
- Profile editing uses a forest introduction, a numbered form and a saved-profile
  sidebar. Show account name and email as read-only; edit biography, comma-separated
  skills, hourly rate and a portfolio link. Explain the 20-skill/30-character limits and
  normalize skills to unique lowercase values. Empty optional fields clear saved
  values. Disable fields while saving, retain drafts on failure, map API errors
  to fields and show a confirmation on success. Discard resets to saved values.
  Keep email out of the public preview and offer a link to the public profile.

- Dashboards share a forest/lime welcome panel, compact real statistics and
  role-specific content. Clients see all order-status counts, the latest five
  projects and an unseen-proposal count; loading the dashboard must not mark
  proposals viewed. Freelancers see assigned active projects, proposal-status
  totals and received rating/review counts; accepted proposals are a historical
  total, not an active-project count. Admins see account-role counts, blocked
  accounts, all order statuses and categories, without invented revenue or
  activity trends. Use existing project cards and real routes for actions. Keep
  loaded content on temporary refresh errors, offer manual refresh and show
  honest zero/empty states. Status bars use each actual count over the total;
  an empty total must produce zero-width bars.

## Status badges

`className="badge ..."` plus:

| Status | Classes | Label |
|---|---|---|
| `OPEN` | `bg-brand-50 text-brand-700 ring-brand-600/20` | Open |
| `IN_PROGRESS` | `bg-blue-50 text-blue-700 ring-blue-600/20` | In progress |
| `REVIEW` | `bg-amber-50 text-amber-700 ring-amber-600/20` | In review |
| `COMPLETED` | `bg-gray-100 text-gray-700 ring-gray-500/20` | Completed |
| `CANCELLED` | `bg-red-50 text-red-700 ring-red-600/20` | Cancelled |
| `PENDING` | `bg-amber-50 text-amber-700 ring-amber-600/20` | Pending |
| `ACCEPTED` | `bg-brand-50 text-brand-700 ring-brand-600/20` | Accepted |
| `REJECTED` | `bg-gray-100 text-gray-600 ring-gray-500/20` | Rejected |

## States

- **Errors**: field errors in `.field-error`, server errors in `.alert-error`
  with `role="alert"`, showing the server's `message`.
- **Loading**: a centered spinner for pages; a disabled button for mutations.
- **Order search**: input updates immediately; URL and query update after a
  400 ms pause. Keep previous cards visible with a small updating indicator;
  disable pagination while typing or showing previous query results.
- **Empty lists**: a white card with a neutral inbox icon, centered title and
  description, and an optional primary action supplied by the parent.
- **Focus**: every interactive element shows a ring on keyboard focus — the
  shared classes already do; keep it on custom elements too.
- **Disabled**: `opacity-60`, no hover effect.

## Components available

| File | What |
|---|---|
| `components/layout/AuthLayout.tsx` | Shell for Login and Register (brand panel + form column) |
| `components/ui/Logo.tsx` | Wordmark; `variant="light"` on dark backgrounds |
| `components/ui/icons.tsx` | Inline SVG icons; size with `className="size-5"` |
| `components/ui/Spinner.tsx` | Centered green loading ring with a text label; respects reduced motion |
| `components/ui/ErrorMessage.tsx` | White error card, red alert icon and server message, optional green retry button |
| `components/ui/EmptyState.tsx` | Empty list card with `title`, optional `description`, and `action: { label, onClick }` |
| `components/ui/Pagination.tsx` | White navigation panel, green current page, numbered desktop buttons and compact mobile page count; hidden for a single page |
| `components/ui/Modal.tsx` | Native dialog with labelled content, keyboard focus handling, backdrop/Escape dismissal and a busy state |
| `components/StatusBadge.tsx` | Order or proposal status pill; labels and colours come from `utils/constants.ts` |
| `components/OrderCard.tsx` | Responsive order card with a linked title, category, status, budget, deadline, proposal count and client rating; receives `order` via props |
| `components/FreelancerCard.tsx` | Pure UI for a professional's identity, rating, biography, skills, hourly rate and profile links |
| `components/Avatar.tsx` | Shared clickable avatar/initials with API-host image resolution and an optional non-linked variant |
| `components/AvatarUpload.tsx` | File selection, local preview, photo upload/removal and feedback without resetting profile drafts |
| `components/FreelancerFilters.tsx` | Name search, exact-skill/rate drafts, sorting, active chips and reset callbacks |
| `components/OrderFilters.tsx` | Search form, status/category dropdowns, active filter chips and reset; receives values and callbacks from the page |
| `components/ProposalForm.tsx` | Create or edit a proposal with shared validation, prefilled edit values, pending/error states and success confirmation |
| `components/ProposalCard.tsx` | Stateless client-facing proposal card with freelancer details, price, letter, sent date, status and an unseen marker |
| `components/OrderProposals.tsx` | Owner-only proposal list with totals, unseen highlights, refresh and loading/error/empty states |
| `components/OrderActions.tsx` | Participant-only progress card with assigned freelancer, permitted status actions, confirmation and mutation feedback |
| `components/OrderChat.tsx` | Private order conversation with live connection status, page navigation, access/loading/error states and REST message sending |
| `components/MessageList.tsx` | Message bubbles, date separators, local times and scrolling that preserves the reading position |
| `components/MessageInput.tsx` | Validated message draft with character count, pending/error states and reset after successful sending |
| `components/StarRating.tsx` | Pure UI for fractional display ratings and keyboard-accessible native radio selection |
| `components/ReviewList.tsx` | Supplied reviews with author, date, rating, comment and own-review marker |
| `components/ReviewForm.tsx` | Validated rating/comment form with pending/error states and one-review submission |
| `components/OrderReviews.tsx` | Completed-project feedback with participant eligibility, fresh duplicate check, public list and published state |
| `components/ProfileReviews.tsx` | Received-review pagination seeded from the profile, with URL pages and local loading/error/empty states |
| `components/WorkspacePlaceholder.tsx` | Shared branded, honest placeholder for sections whose functionality is pending |
| `components/MyProposal.tsx` | Checks the current freelancer's proposal for an order; shows its details or the application form, with loading and retry states |
| `pages/Orders.tsx` | Marketplace header, total count and latest orders in a two-column desktop grid; the header stays visible during loading, empty and error states |
| `pages/OrderDetails.tsx` | Project brief with status and dates, budget and facts sidebar, client initials and rating; loading, retry and order-not-found states |
| `pages/FreelancerProfile.tsx` | Role-aware public profile with biography, skills, rate, portfolio, received reviews and loading/retry/not-found states |
| `pages/Freelancers.tsx` | Talent directory with debounced name search, URL filters, validation, sorting and pagination |
| `pages/MyProfile.tsx` | Freelancer profile form with validation, changed-field PATCH, account details and a saved-profile sidebar |
| `components/dashboard/` | Role-specific dashboard views, a statistic card and an order-status summary |
| `pages/Dashboard.tsx` | Current-user dashboard loading, refresh/error states and role dispatch |
| `pages/EditOrder.tsx` | Prefilled order form with category selection, local deadline input, field errors and a disabled save state while submitting |
| `pages/CreateOrder.tsx` | Empty project form with category selection, budget and local deadline validation, API field errors and a link to the created order after publishing |
