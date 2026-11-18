// 404 page (also used for 403 when the role does not match: <NotFound code={403} inline />).
// Full page by default; `inline` renders a card for use inside Layout, under the navbar.
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { ArrowLeftIcon, HomeIcon } from "@/components/ui/icons";

const CONTENT = {
  404: {
    title: "Page not found",
    text: "The page you are looking for doesn't exist or has been moved. Check the address or head back home.",
  },
  403: {
    title: "Access denied",
    text: "This page isn't available for your account. If you think it should be, log in with a different role.",
  },
};

type NotFoundProps = {
  code?: keyof typeof CONTENT;
  inline?: boolean;
};

export default function NotFound({ code = 404, inline = false }: NotFoundProps) {
  const navigate = useNavigate();
  const { title, text } = CONTENT[code];

  // React Router keeps the position in its own history stack in history.state.idx;
  // 0 means the page was opened directly, so "back" would leave the site.
  const canGoBack = (window.history.state?.idx ?? 0) > 0;

  const body = (
    <div className="w-full max-w-lg text-center">
      <p
        aria-hidden="true"
        className={`font-display leading-none tracking-tighter text-brand-600 select-none ${
          inline ? "text-[88px] sm:text-[120px]" : "text-[120px] sm:text-[168px]"
        }`}
      >
        {code}
      </p>

      <h1 className="mt-6 font-display text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-gray-500">{text}</p>

      <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        {canGoBack && (
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary btn-lg">
            <ArrowLeftIcon className="size-5" />
            Go back
          </button>
        )}
        <Link to="/" className="btn btn-primary btn-lg">
          <HomeIcon className="size-5" />
          Back to home
        </Link>
      </div>
    </div>
  );

  // Inside Layout: the navbar already shows the logo and Layout owns <main>.
  if (inline) {
    return (
      <section className="card relative flex items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-56 left-1/2 size-[28rem] -translate-x-1/2 rounded-full border border-brand-200/60"
        />
        <div className="relative w-full max-w-lg">{body}</div>
      </section>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 px-5 py-6 sm:px-10 lg:py-8">
      {/* Restrained outlines echo the marketplace's editorial style. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -bottom-40 size-[36rem] rounded-full border border-brand-200/70"><div className="absolute inset-10 rounded-full border border-brand-200/70" /></div>

      <Link to="/" className="relative self-start rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30">
        <Logo />
      </Link>

      <main className="relative flex flex-1 items-center justify-center py-12">
        {body}
      </main>

      <p className="relative text-center text-xs text-gray-400">© {new Date().getFullYear()} FreelanceHub</p>
    </div>
  );
}
