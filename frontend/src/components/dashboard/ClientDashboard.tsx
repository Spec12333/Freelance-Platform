import { Link } from "react-router-dom";
import OrderCard from "@/components/orders/OrderCard";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowUpRightIcon, BriefcaseIcon, ChatIcon, LayersIcon, StarIcon } from "@/components/ui/icons";
import type { ClientDashboard as ClientDashboardData } from "@/types/api";
import DashboardStat from "@/components/ui/DashboardStat";
import OrderStatusSummary from "./OrderStatusSummary";

// Client statistics and the five latest projects supplied by the dashboard API.
export default function ClientDashboard({ data }: { data: ClientDashboardData }) {
  const total = Object.values(data.orders).reduce((sum, count) => sum + count, 0);
  const active = data.orders.IN_PROGRESS + data.orders.REVIEW;

  return (
    <div className="space-y-7" data-dashboard-role="CLIENT">
      <dl aria-label="Client statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Your projects" value={total} hint="Across all project statuses" icon={<BriefcaseIcon className="size-4" />} />
        <DashboardStat label="Active collaborations" value={active} hint="In progress or waiting for your review" icon={<LayersIcon className="size-4" />} />
        <DashboardStat label="Completed projects" value={data.orders.COMPLETED} hint="Projects you have marked complete" icon={<StarIcon className="size-4" />} />
        <DashboardStat label="New proposals" value={data.unseenProposals} hint="Pending offers you haven't opened yet" icon={<ChatIcon className="size-4" />} accent />
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="dashboard-projects-heading" className="min-w-0">
          <div className="mb-5"><p className="eyebrow text-brand-700">From brief to collaboration</p><h2 id="dashboard-projects-heading" className="mt-3 font-display text-3xl tracking-tight text-ink">Your latest projects.</h2><p className="mt-2 text-sm leading-6 text-gray-500">Your five most recent projects. Open a project to read proposals, follow progress or continue a conversation.</p></div>
          {data.recentOrders.length > 0 ? <div className="grid items-start gap-5 xl:grid-cols-2">{data.recentOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
            : <EmptyState title="A great project starts with your idea." description="Post your first brief and give independent talent something exciting to work on." />}
        </section>

        <aside aria-label="Your project overview" className="min-w-0 space-y-6">
          <OrderStatusSummary counts={data.orders} />
          <section className="rounded-2xl border border-brand-200 bg-cream p-6"><ChatIcon className="size-5 text-brand-700" /><h2 className="mt-4 font-display text-2xl tracking-tight text-ink">{data.unseenProposals > 0 ? "New perspectives are waiting." : "Keep the conversation going."}</h2><p className="mt-3 text-sm leading-6 text-gray-500">{data.unseenProposals > 0 ? `You have ${data.unseenProposals} unread pending ${data.unseenProposals === 1 ? "proposal" : "proposals"}. Open the proposals in your projects to compare offers and find the right collaborator.` : "New pending proposals will be counted here until you open the proposal list in their project."}</p></section>
          <section className="rounded-2xl bg-brand-950 p-6 text-white"><p className="eyebrow text-lime">A fresh perspective</p><h2 className="mt-4 font-display text-3xl tracking-tight">Find your next collaborator.</h2><p className="mt-3 text-sm leading-6 text-white/65">Explore skills, portfolios and feedback from the community.</p><Link to="/freelancers" className="btn btn-sm mt-5 w-full bg-lime text-brand-950 hover:bg-brand-200">Explore talent<ArrowUpRightIcon className="size-4" /></Link></section>
        </aside>
      </div>
    </div>
  );
}
