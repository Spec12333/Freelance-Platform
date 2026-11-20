import { Link } from "react-router-dom";
import OrderCard from "@/components/orders/OrderCard";
import StatusBadge from "@/components/ui/StatusBadge";
import StarRating from "@/components/ui/StarRating";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowUpRightIcon, BriefcaseIcon, ChatIcon, LayersIcon, StarIcon } from "@/components/ui/icons";
import type { FreelancerDashboard as FreelancerDashboardData } from "@/types/api";
import type { ProposalStatus } from "@/types/models";
import { PROPOSAL_STATUS } from "@/utils/constants";
import { formatRating } from "@/utils/format";
import DashboardStat from "@/components/ui/DashboardStat";

type FreelancerDashboardProps = { data: FreelancerDashboardData; userId: number };

// Active assignments and proposal history describe different things.
export default function FreelancerDashboard({ data, userId }: FreelancerDashboardProps) {
  const proposalTotal = Object.values(data.proposals).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-7" data-dashboard-role="FREELANCER">
      <dl aria-label="Freelancer statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Active projects" value={data.activeOrders.length} hint="Your assignments in progress or in review" icon={<BriefcaseIcon className="size-4" />} accent />
        <DashboardStat label="Pending proposals" value={data.proposals.PENDING} hint="Offers awaiting a client's decision" icon={<ChatIcon className="size-4" />} />
        <DashboardStat label="Accepted proposals" value={data.proposals.ACCEPTED} hint="All time, including projects already closed" icon={<LayersIcon className="size-4" />} />
        <DashboardStat label="Your rating" value={formatRating(data.rating)} hint={`${data.reviewsCount} received ${data.reviewsCount === 1 ? "review" : "reviews"}`} icon={<StarIcon className="size-4" />} />
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="dashboard-projects-heading" className="min-w-0">
          <div className="mb-5"><p className="eyebrow text-brand-700">The work on your plate</p><h2 id="dashboard-projects-heading" className="mt-3 font-display text-3xl tracking-tight text-ink">Make good things happen.</h2><p className="mt-2 text-sm leading-6 text-gray-500">Your assigned projects in progress or in review. Open a project to continue the work and talk with your client.</p></div>
          {data.activeOrders.length > 0 ? <div className="grid items-start gap-5 xl:grid-cols-2">{data.activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
            : <EmptyState title="Your next collaboration is out there." description="You have no active assignments yet. Explore open projects and send a proposal when something feels like a good fit." />}
        </section>

        <aside aria-label="Your professional overview" className="min-w-0 space-y-6">
          <section aria-labelledby="dashboard-proposals-heading" className="card p-6"><p className="eyebrow text-brand-700">Every opportunity counts</p><h2 id="dashboard-proposals-heading" className="mt-3 font-display text-2xl tracking-tight text-ink">Your proposals</h2><p className="mt-2 text-xs text-gray-500">{proposalTotal} total across all statuses</p><dl className="mt-5 divide-y divide-gray-100">{(Object.keys(PROPOSAL_STATUS) as ProposalStatus[]).map((status) => <div key={status} className="flex items-center justify-between gap-3 py-3"><dt><StatusBadge status={status} /></dt><dd className="text-sm font-semibold text-ink">{data.proposals[status]}</dd></div>)}</dl><p className="mt-3 text-xs leading-6 text-gray-500">Each offer stays with its project. Accepted proposals include completed and cancelled collaborations.</p></section>
          <section aria-labelledby="dashboard-feedback-heading" className="card p-6"><h2 id="dashboard-feedback-heading" className="font-display text-2xl tracking-tight text-ink">Built on good work.</h2><div className="mt-4 flex flex-wrap items-center gap-3">{data.rating !== null && <StarRating value={Number(data.rating.toFixed(1))} />}<span className="text-sm font-semibold text-ink">{formatRating(data.rating)}</span></div><p className="mt-3 text-sm leading-6 text-gray-500">{data.reviewsCount === 0 ? "Feedback from completed collaborations will appear on your public profile." : `${data.reviewsCount} ${data.reviewsCount === 1 ? "review from a completed collaboration." : "reviews from completed collaborations."}`}</p><Link to={`/freelancers/${userId}`} className="btn btn-secondary btn-sm mt-5 w-full">View your profile<ArrowUpRightIcon className="size-4" /></Link></section>
          <section className="rounded-2xl border border-brand-200 bg-cream p-6"><p className="eyebrow text-brand-700">Make it yours</p><h2 className="mt-4 font-display text-2xl tracking-tight text-ink">Let your skills speak.</h2><p className="mt-3 text-sm leading-6 text-gray-500">Keep your introduction, skills and portfolio ready for the next opportunity.</p><Link to="/profile" className="btn btn-secondary btn-sm mt-5 w-full">Edit your profile<ArrowUpRightIcon className="size-4" /></Link></section>
        </aside>
      </div>
    </div>
  );
}
