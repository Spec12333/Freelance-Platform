import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { useFreelancer } from "@/hooks/useFreelancers";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/api/client";
import { formatDate, formatMoney, formatRating } from "@/utils/format";
import { getWebUrl } from "@/utils/links";
import ProfileReviews from "@/components/reviews/ProfileReviews";
import StarRating from "@/components/ui/StarRating";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, ArrowUpRightIcon, BriefcaseIcon, CalendarIcon, LayersIcon, UserIcon } from "@/components/ui/icons";
import type { Role } from "@/types/models";

const ROLE_LABELS: Record<Role, string> = {
  FREELANCER: "Independent professional",
  CLIENT: "Client",
  ADMIN: "Administrator",
};

// Load a public profile and keep review requests scoped to the resolved user.
export default function FreelancerProfile() {
  const { id } = useParams();
  const profileId = Number(id);
  const isValidId = Number.isSafeInteger(profileId) && profileId > 0;
  const { data: profile, isPending, isError, error, refetch, dataUpdatedAt } = useFreelancer(profileId);
  const currentUser = useAuthStore((state) => state.user);
  const backLink = <Link to="/freelancers" className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-gray-500 outline-none transition hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20"><ArrowLeftIcon className="size-4" />Back to freelancers</Link>;
  const isNotFound = !isValidId || (isAxiosError(error) && error.response?.status === 404);

  if (isNotFound) {
    return <div className="space-y-6">{backLink}<h1 className="sr-only">Profile not found</h1><EmptyState title="Profile not found" description="This profile doesn't exist or is no longer available. Explore the community to find your next collaborator." /><Link to="/orders" className="btn btn-primary">Explore projects<ArrowUpRightIcon className="size-4" /></Link></div>;
  }

  if (isPending) {
    return <div className="space-y-6">{backLink}<div className="card flex min-h-96 items-center justify-center p-8"><Spinner label="Loading profile…" /></div></div>;
  }

  if (isError) {
    return <div className="space-y-6">{backLink}<ErrorMessage title="We couldn't load this profile" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} /></div>;
  }

  const isFreelancer = profile.role === "FREELANCER";
  const isOwnProfile = currentUser?.id === profile.id;
  const portfolio = getWebUrl(profile.portfolioUrl);
  const canEdit = isOwnProfile && currentUser?.role === "FREELANCER" && !profile.isBlocked;
  const canPostProject = currentUser?.role === "CLIENT" && isFreelancer && !profile.isBlocked;

  return (
    <div className="space-y-7">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-sm">{backLink}<span aria-hidden="true" className="text-gray-300">/</span><span aria-current="page" className="min-w-0 text-gray-400 [overflow-wrap:anywhere]">{profile.name}</span></nav>

      <header className="card min-w-0 overflow-hidden">
        <div className="relative overflow-hidden bg-brand-950 px-6 pt-7 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
          <p className="eyebrow relative z-10 text-lime">The person behind the work</p>
          <svg aria-hidden="true" viewBox="0 0 320 160" fill="none" className="pointer-events-none absolute -right-7 bottom-0 h-44 text-lime/15"><circle cx="235" cy="160" r="140" stroke="currentColor" /><circle cx="235" cy="160" r="105" stroke="currentColor" /><circle cx="235" cy="160" r="70" stroke="currentColor" /></svg>
        </div>
        <div className="relative p-6 pt-0 sm:p-8 sm:pt-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Avatar user={profile} className="-mt-12 size-24 border-[6px] border-white text-3xl sm:-mt-14 sm:size-28" />
            <div className="flex flex-wrap items-center gap-3 sm:pt-5">
              {isOwnProfile && <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">Your public profile</span>}
              {profile.isBlocked && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">Account unavailable</span>}
              {canEdit && <Link to="/profile" className="btn btn-secondary btn-sm">Edit profile<ArrowUpRightIcon className="size-4" /></Link>}
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0"><p className="eyebrow text-brand-700">{ROLE_LABELS[profile.role]}</p><h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:text-5xl">{profile.name}</h1><p className="mt-4 flex items-center gap-2 text-xs text-gray-500"><CalendarIcon className="size-4 shrink-0" />Member since <time dateTime={profile.createdAt}>{formatDate(profile.createdAt)}</time></p></div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl bg-paper px-5 py-4">
              {profile.rating !== null && <StarRating value={Number(profile.rating.toFixed(1))} />}
              <span className="text-sm font-semibold text-ink">{formatRating(profile.rating)}</span><span className="text-xs text-gray-500">· {profile.reviewsCount} {profile.reviewsCount === 1 ? "review" : "reviews"}</span>
            </div>
          </div>
        </div>
      </header>

      {profile.isBlocked && <p role="status" className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm leading-relaxed text-gray-500">This account is currently unavailable for new collaborations. Its profile and past feedback remain visible.</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="profile-about-heading" className="card overflow-hidden">
            <div className="p-6 sm:p-8"><p className="eyebrow text-brand-700">A little introduction</p><h2 id="profile-about-heading" className="mt-3 font-display text-3xl tracking-tight text-ink">{isFreelancer ? "Experience. Approach. Perspective." : "About this person."}</h2>
              {profile.bio?.trim() ? <p className="mt-5 text-[15px] leading-7 whitespace-pre-wrap text-gray-600 [overflow-wrap:anywhere]">{profile.bio}</p> : <div className="mt-5 rounded-2xl bg-paper p-5"><p className="text-sm leading-relaxed text-gray-500">An introduction hasn't been added yet.</p></div>}
            </div>
            {isFreelancer && <div className="border-t border-gray-200 p-6 sm:p-8"><h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><LayersIcon className="size-4 text-brand-600" />Skills & expertise</h3>{profile.skills.length > 0 ? <ul aria-label="Skills" className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <li key={skill} className="max-w-full rounded-full border border-gray-200 bg-cream px-3.5 py-2 text-xs font-medium text-gray-700 [overflow-wrap:anywhere]">{skill}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">Skills haven't been added yet.</p>}</div>}
          </section>

          {/* The embedded first page avoids a duplicate request on initial load. */}
          <ProfileReviews key={profile.id} profile={profile} updatedAt={dataUpdatedAt} />
        </div>

        <aside aria-label="Profile details" className="min-w-0 space-y-6">
          {isFreelancer && <section aria-labelledby="profile-rate-heading" className="card p-6"><div className="flex items-center justify-between gap-3"><h2 id="profile-rate-heading" className="eyebrow text-gray-500">Hourly rate</h2><BriefcaseIcon className="size-4 text-gray-400" /></div><p className={`mt-4 font-display tracking-tight text-ink ${profile.hourlyRate === null ? "text-2xl" : "text-5xl"}`}>{profile.hourlyRate === null ? "Rate not listed" : formatMoney(profile.hourlyRate)}{profile.hourlyRate !== null && <span className="ml-1 font-sans text-sm text-gray-400">/ hr</span>}</p><p className="mt-3 text-xs leading-relaxed text-gray-500">{profile.hourlyRate === null ? "Discuss the project scope and pricing before starting a collaboration." : "USD · Rate listed by this professional. Project terms are agreed separately."}</p></section>}

          <section aria-labelledby="profile-portfolio-heading" className="card p-6"><h2 id="profile-portfolio-heading" className="text-base font-semibold text-ink">Beyond the profile</h2><p className="mt-3 text-sm leading-relaxed text-gray-500">{portfolio ? "Take a closer look at their work and experience." : "A portfolio link hasn't been added yet."}</p>{portfolio && <a href={portfolio.href} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-paper p-4 text-sm font-semibold text-brand-700 outline-none transition hover:border-brand-300 focus-visible:ring-4 focus-visible:ring-brand-600/20"><span className="min-w-0 [overflow-wrap:anywhere]">{portfolio.hostname.replace(/^www\./, "")}</span><ArrowUpRightIcon className="mt-0.5 size-4 shrink-0" /><span className="sr-only">Open portfolio in a new tab</span></a>}</section>

          <section className="rounded-2xl bg-brand-950 p-6 text-white"><UserIcon aria-hidden="true" className="size-6 text-lime" /><h2 className="mt-5 font-display text-3xl leading-tight tracking-tight">{canEdit ? "Make it yours." : canPostProject ? "Good work starts with a good brief." : "Your next chapter is out there."}</h2><p className="mt-4 text-sm leading-relaxed text-white/65">{canEdit ? "Keep your story, skills and work up to date so the right people can find you." : canPostProject ? "Share your goals and let freelancers propose how to bring your project to life." : "Explore projects and discover your next opportunity to work together."}</p><Link to={canEdit ? "/profile" : canPostProject ? "/orders/new" : "/orders"} className="btn mt-6 w-full bg-lime text-brand-950 hover:bg-brand-200 focus-visible:ring-lime/40">{canEdit ? "Edit your profile" : canPostProject ? "Post a project" : "Explore projects"}<ArrowUpRightIcon className="size-4" /></Link></section>
        </aside>
      </div>
    </div>
  );
}
