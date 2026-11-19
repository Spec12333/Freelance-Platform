import { Link } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { ArrowUpRightIcon, HomeIcon, RefreshIcon } from "@/components/ui/icons";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/types/models";
import { formatTime } from "@/utils/format";

const INTRO: Record<Role, { eyebrow: string; title: string; description: string; action: string; to: string }> = {
  CLIENT: { eyebrow: "Your client workspace", title: "Bring your next idea to life.", description: "A clear view of your projects, new proposals and the people helping you move forward.", action: "Post a project", to: "/orders/new" },
  FREELANCER: { eyebrow: "Your independent workspace", title: "Your work. Your next chapter.", description: "Keep your collaborations moving and make room for the next opportunity.", action: "Find your next project", to: "/orders?status=OPEN" },
  ADMIN: { eyebrow: "Your administration workspace", title: "Keep the community moving.", description: "A shared view of the people, projects and categories that make FreelanceHub work.", action: "Users workspace", to: "/admin/users" },
};

// Fetch once for this account, then render the matching API role.
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { data, isPending, isError, error, isFetching, refetch, dataUpdatedAt } = useDashboard();
  if (!user) return null;
  const intro = INTRO[user.role];
  const firstName = user.name.trim().split(/\s+/)[0];
  // Never render another role's cached response as this account's workspace.
  const hasRoleMismatch = data !== undefined && data.role !== user.role;

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-7 rounded-3xl bg-brand-950 p-7 text-white sm:p-10 lg:flex-row lg:items-end">
        <div className="min-w-0 max-w-2xl"><p className="eyebrow flex items-center gap-2 text-lime"><HomeIcon className="size-4" />{intro.eyebrow}</p><h1 className="mt-5 font-display text-4xl leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-5xl">Good to see you, {firstName}.<br /><span className="text-lime">{intro.title}</span></h1><p className="mt-4 max-w-lg text-sm leading-7 text-white/65">{intro.description}</p></div>
        <Link to={intro.to} className="btn shrink-0 self-start bg-lime text-brand-950 hover:bg-brand-200 lg:self-auto">{intro.action}<ArrowUpRightIcon className="size-4" /></Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-gray-500">{isFetching ? "Updating your workspace…" : dataUpdatedAt > 0 && !hasRoleMismatch ? <>Last refreshed <time dateTime={new Date(dataUpdatedAt).toISOString()}>{formatTime(new Date(dataUpdatedAt).toISOString())}</time></> : "Your workspace at a glance"}</p><button type="button" onClick={() => { void refetch(); }} disabled={isFetching} className="btn btn-secondary btn-sm"><RefreshIcon className={`size-4 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />Refresh</button></div>

      {hasRoleMismatch ? <ErrorMessage title="We couldn't load your workspace" message="The dashboard response does not match your account. Please try again." onRetry={() => { void refetch(); }} />
        : !data ? isPending ? <div className="card p-10"><Spinner label="Loading your workspace…" /></div>
          : <ErrorMessage title="We couldn't load your workspace" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} />
          : <>
            {/* A failed background refresh keeps the last successful summary. */}
            {isError && <p role="alert" className="alert-error">We couldn't refresh your workspace. Showing the last loaded data. {getErrorMessage(error)} Use Refresh to try again.</p>}
            <div aria-busy={isFetching}>
              {data.role === "CLIENT" && <ClientDashboard data={data} />}
              {data.role === "FREELANCER" && <FreelancerDashboard data={data} userId={user.id} />}
              {data.role === "ADMIN" && <AdminDashboard data={data} />}
            </div>
          </>}
    </div>
  );
}
