# Design Guide

One visual language for every screen. The reference is the Register page
(`frontend/src/pages/Register.tsx`). When a new screen needs something not
covered here, add it here first.

## Character

A clean marketplace in the spirit of Upwork and Fiverr: lots of white, one
confident green for actions, bold headings, soft rounded cards. Green means
"act here", so inside the app it is not used for decoration.

## Where the style lives

All of it is in `frontend/src/index.css`:

- `@theme` — tokens: the font, the `brand-*` green scale, two shadows.
- `@layer components` — shared classes for repeated UI (`.input`, `.btn`, …).
  Utilities written next to them win, so `className="input pl-11"` works.

Everything else is plain Tailwind utilities in the markup.

## Tokens

| Token | Use |
|---|---|
| `font-sans` — Plus Jakarta Sans | Everything. Loaded in `index.html` |
| `brand-600` / hover `brand-700` | Primary buttons, links |
| `brand-50` + `brand-600` border | Selected state |
| `brand-950` | Dark brand surfaces (the auth side panel) |
| Tailwind `gray-*` | Text and borders: headings `900`, body `700`, secondary `500`, placeholders `400`, borders `200`/`300` |
| Tailwind `red-*` | Errors and destructive actions only |
| Tailwind `amber-*` | Ratings (stars `amber-400`) and "new" highlights |
| `shadow-card` | Resting cards |
| `shadow-float` | Things above the page: dropdowns, modals |

## Shared classes

| Class | What |
|---|---|
| `.card` | White rounded panel with border and shadow. Add padding: `card p-5` |
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
| Page title | `text-3xl font-extrabold tracking-tight text-gray-900` |
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
- One primary button per view.
- Avatars without an image: initials on `bg-brand-100 text-brand-800`.

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
- **Focus**: every interactive element shows a ring on keyboard focus — the
  shared classes already do; keep it on custom elements too.
- **Disabled**: `opacity-60`, no hover effect.

## Components available

| File | What |
|---|---|
| `components/layout/AuthLayout.tsx` | Shell for Login and Register (brand panel + form column) |
| `components/ui/Logo.tsx` | Wordmark; `variant="light"` on dark backgrounds |
| `components/ui/icons.tsx` | Inline SVG icons; size with `className="size-5"` |
