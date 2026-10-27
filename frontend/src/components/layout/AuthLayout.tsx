// Shell for Login and Register: a brand panel on the left (desktop only)
// and the form column on the right. Purely visual, no logic.
import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { ChatIcon, ShieldIcon, StarIcon } from "@/components/ui/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:py-8">
        <Logo className="lg:hidden" />

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">{children}</div>

        <p className="text-center text-xs text-gray-400">© {new Date().getFullYear()} FreelanceHub</p>
      </main>
    </div>
  );
}

const FEATURES = [
  { icon: ShieldIcon, text: "Strict order flow — every step is checked by the server" },
  { icon: StarIcon, text: "Two-sided reviews, only after the work is done" },
  { icon: ChatIcon, text: "A private chat with the freelancer you hired" },
];

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-brand-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      {/* Decoration: two blurred glows and a dot grid. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 size-[32rem] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-40 -bottom-48 size-[30rem] rounded-full bg-brand-300/15 blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <Logo variant="light" className="relative" />

      <div className="relative">
        <h2 className="max-w-md text-4xl leading-[1.15] font-extrabold tracking-tight xl:text-[44px]">
          Hire the right freelancer. <span className="text-brand-300">Get the work done.</span>
        </h2>
        <p className="mt-4 max-w-md text-brand-100/80">
          Post an order, compare proposals and pay attention to the work, not the paperwork.
        </p>

        <ul className="mt-8 space-y-3.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[15px] text-brand-50">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-300 ring-1 ring-white/15">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <ProductPreview />
    </aside>
  );
}

// A static mock of the real UI (seed order 1 and Anna's proposal on it).
// Hidden on short screens so the panel never needs to scroll.
function ProductPreview() {
  return (
    <div aria-hidden="true" className="relative hidden [@media(min-height:860px)]:block">
      <div className="max-w-sm rounded-2xl bg-white p-5 text-gray-900 shadow-float">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Web Development</span>
          <span className="badge bg-brand-50 text-brand-700 ring-brand-600/20">Open</span>
        </div>
        <p className="mt-2 font-bold">Landing page for an online store</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-bold text-gray-900">$300</span>
          <span className="text-gray-500">3 proposals</span>
        </div>
      </div>

      <div className="relative -mt-4 ml-auto w-64 rotate-2 rounded-2xl bg-white p-4 text-gray-900 shadow-float xl:mr-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
            AH
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Anna Hakobyan</p>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <StarIcon className="size-3.5 text-amber-400" /> 4.5 · 2 reviews
            </p>
          </div>
          <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            New
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold">$280</span>
          <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">Accept</span>
        </div>
      </div>
    </div>
  );
}
