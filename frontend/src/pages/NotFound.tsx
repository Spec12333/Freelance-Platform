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
        className={`bg-linear-to-b from-brand-600 to-brand-300 bg-clip-text leading-none font-extrabold tracking-tighter text-transparent select-none ${
          inline ? "text-[88px] sm:text-[120px]" : "text-[120px] sm:text-[168px]"
        }`}
      >
        {code}
      </p>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[32px]">{title}</h1>
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
          className="pointer-events-none absolute -top-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        />
        <div className="relative w-full max-w-lg">{body}</div>
      </section>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 px-5 py-6 sm:px-10 lg:py-8">
      {/* Decoration: a soft brand glow and a dot grid fading out downwards. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-brand-200/50 blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgb(5 51 33 / 0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

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
