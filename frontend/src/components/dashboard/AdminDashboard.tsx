import { Link } from "react-router-dom";
import { ArrowUpRightIcon, BriefcaseIcon, LayersIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";
import type { AdminDashboard as AdminDashboardData } from "@/types/api";
import type { Role } from "@/types/models";
import DashboardStat from "./DashboardStat";
import OrderStatusSummary from "./OrderStatusSummary";

const ROLE_LABELS: Record<Role, string> = { CLIENT: "Clients", FREELANCER: "Freelancers", ADMIN: "Administrators" };

// Platform-wide totals; blocked accounts are included in role counts.
export default function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const totalUsers = Object.values(data.users).reduce((sum, count) => sum + count, 0);
  const totalOrders = Object.values(data.orders).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-7" data-dashboard-role="ADMIN">
      <dl aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Community members" value={totalUsers} hint="Clients, freelancers and administrators" icon={<UserIcon className="size-4" />} />
        <DashboardStat label="Platform projects" value={totalOrders} hint="All projects across every status" icon={<BriefcaseIcon className="size-4" />} />
        <DashboardStat label="Blocked accounts" value={data.blockedUsers} hint="Included in the community member total" icon={<ShieldIcon className="size-4" />} accent />
        <DashboardStat label="Categories" value={data.categories} hint="Project categories in the marketplace" icon={<LayersIcon className="size-4" />} />
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
        <section aria-labelledby="dashboard-community-heading" className="card min-w-0 p-6"><p className="eyebrow text-brand-700">People make the platform</p><h2 id="dashboard-community-heading" className="mt-3 font-display text-2xl tracking-tight text-ink">Your community</h2><dl className="mt-6 divide-y divide-gray-100">{(Object.keys(ROLE_LABELS) as Role[]).map((role) => <div key={role} className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-gray-600">{ROLE_LABELS[role]}</dt><dd className="font-display text-3xl tracking-tight text-ink">{data.users[role]}</dd></div>)}</dl><p className="mt-4 text-xs leading-6 text-gray-500">Counts include blocked accounts. Blocking changes access without deleting a member's history.</p></section>
        <OrderStatusSummary counts={data.orders} />
        <aside aria-label="Administration shortcuts" className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-brand-950 p-6 text-white"><ShieldIcon className="size-6 text-lime" /><h2 className="mt-5 font-display text-3xl tracking-tight">A community worth looking after.</h2><p className="mt-4 text-sm leading-6 text-white/65">Your administration workspace brings people and project categories together.</p><div className="mt-6 space-y-3"><Link to="/admin/users" className="btn btn-sm w-full bg-lime text-brand-950 hover:bg-brand-200">Users workspace<ArrowUpRightIcon className="size-4" /></Link><Link to="/admin/categories" className="btn btn-sm w-full border border-white/25 text-white hover:bg-white/10">Categories workspace<ArrowUpRightIcon className="size-4" /></Link></div></section>
          <Link to="/orders" className="btn btn-secondary w-full">Explore projects<ArrowUpRightIcon className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
