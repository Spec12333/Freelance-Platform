import { Link } from "react-router-dom";
import type { User } from "@/types/models";
import { formatMoney, formatRating } from "@/utils/format";
import Avatar from "./Avatar";
import StarRating from "./StarRating";
import { ArrowUpRightIcon } from "./ui/icons";

type FreelancerCardProps = {
  freelancer: User;
};

// Present one professional; searching and fetching belong to the page.
export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const profilePath = `/freelancers/${freelancer.id}`;
  const skills = freelancer.skills.slice(0, 3);

  return (
    <article aria-labelledby={`freelancer-name-${freelancer.id}`} className="card flex h-full min-w-0 flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_12px_30px_-20px_rgb(21_44_25/0.25)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex flex-1 flex-col p-6">
        <header className="flex min-w-0 items-start gap-4">
          <Avatar user={freelancer} className="size-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h2 id={`freelancer-name-${freelancer.id}`} className="text-lg leading-snug font-semibold tracking-tight text-ink [overflow-wrap:anywhere]"><Link to={profilePath} className="rounded outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20">{freelancer.name}</Link></h2>
            <p className="mt-1.5 text-xs text-gray-500">Independent professional</p>
          </div>
          <Link to={profilePath} aria-label={`View ${freelancer.name}'s profile`} className="grid size-8 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-500 outline-none transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20"><ArrowUpRightIcon className="size-4" /></Link>
        </header>

        <div className="mt-5 flex min-h-5 flex-wrap items-center gap-2">
          {freelancer.rating !== null ? <><StarRating value={Number(freelancer.rating.toFixed(1))} size="sm" /><span className="text-xs font-semibold text-ink">{formatRating(freelancer.rating)}</span><span className="text-xs text-gray-500">({freelancer.reviewsCount} {freelancer.reviewsCount === 1 ? "review" : "reviews"})</span></> : <span className="text-xs text-gray-500">No ratings yet</span>}
        </div>
        <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-500 [overflow-wrap:anywhere]">{freelancer.bio?.trim() || "This professional hasn't added an introduction yet. Visit their profile to learn more."}</p>

        {skills.length > 0 ? <ul aria-label="Skills" className="mt-5 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className="max-w-full rounded-full border border-gray-200 bg-cream px-3 py-1.5 text-[11px] font-medium text-gray-700 [overflow-wrap:anywhere]">{skill}</li>)}{freelancer.skills.length > skills.length && <li className="rounded-full px-1 py-1.5 text-[11px] text-gray-400">+{freelancer.skills.length - skills.length}<span className="sr-only"> more skills on profile</span></li>}</ul> : <p className="mt-5 text-xs text-gray-400">Skills not listed yet</p>}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 bg-paper/60 px-6 py-5">
        <div><p className="text-[10px] text-gray-500">Hourly rate</p><p className={`mt-1 text-ink ${freelancer.hourlyRate === null ? "text-sm font-medium" : "font-display text-3xl tracking-tight"}`}>{freelancer.hourlyRate === null ? "Not listed" : formatMoney(freelancer.hourlyRate)}{freelancer.hourlyRate !== null && <span className="ml-1 font-sans text-xs text-gray-400">/ hr</span>}</p></div>
        <Link to={profilePath} className="btn btn-secondary btn-sm text-brand-700">View profile<ArrowUpRightIcon className="size-3.5" /></Link>
      </footer>
    </article>
  );
}
