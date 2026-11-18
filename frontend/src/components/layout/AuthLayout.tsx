// Shared visual shell for signing in and creating an account.
import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { ArrowUpRightIcon, ChatIcon, ShieldIcon, StarIcon } from "@/components/ui/icons";

const FEATURES = [
  { icon: ShieldIcon, title: "Start with clarity", text: "Clear briefs, thoughtful proposals and the right collaborator." },
  { icon: ChatIcon, title: "Stay connected", text: "A private conversation that keeps your project moving." },
  { icon: StarIcon, title: "Build your reputation", text: "Honest feedback from the people you have worked with." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-[720px] lg:flex-col lg:justify-between xl:p-16">
        <Logo variant="light" className="relative z-10" />
        <div className="relative z-10 py-12">
          <p className="eyebrow text-lime">Independent talent. Shared ambition.</p>
          <h1 className="mt-7 max-w-xl font-display text-6xl leading-[1.02] tracking-tight xl:text-[78px]">Great people.<br /><span className="text-lime">Better work.</span></h1>
          <p className="mt-7 max-w-sm text-[15px] leading-7 text-white/65">Bring your ideas, your skills and your ambition. Find the people who help you take them further.</p>
          <span aria-hidden="true" className="mt-9 inline-flex size-14 items-center justify-center rounded-full border border-lime/40 text-lime"><ArrowUpRightIcon className="size-7" /></span>
        </div>
        <div className="relative z-10 space-y-5 border-t border-white/15 pt-7">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4"><Icon className="mt-1 size-5 shrink-0 text-lime" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-white/55">{text}</p></div></div>
          ))}
        </div>
        {/* A quiet geometric motif keeps the brand panel independent of images. */}
        <svg aria-hidden="true" viewBox="0 0 320 520" fill="none" className="pointer-events-none absolute -right-40 top-24 h-[600px] text-lime/10"><rect x="20" y="20" width="280" height="480" rx="140" stroke="currentColor" strokeWidth="2" /><rect x="60" y="60" width="200" height="400" rx="100" stroke="currentColor" strokeWidth="2" /><rect x="100" y="100" width="120" height="320" rx="60" stroke="currentColor" strokeWidth="2" /></svg>
      </aside>
      <main className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:px-12">
        <Logo className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-[470px] flex-1 flex-col justify-center py-10"><div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-9">{children}</div></div>
        <p className="text-center text-xs text-gray-400">© {new Date().getFullYear()} FreelanceHub · Make good work happen.</p>
      </main>
    </div>
  );
}
