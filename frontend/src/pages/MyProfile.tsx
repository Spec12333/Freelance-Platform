import { isAxiosError } from "axios";
import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import { ArrowUpRightIcon, BriefcaseIcon, LayersIcon, UserIcon } from "@/components/ui/icons";
import StarRating from "@/components/ui/StarRating";
import Avatar from "@/components/ui/Avatar";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { useUpdateMyProfile } from "@/hooks/useFreelancers";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody, UpdateProfileBody } from "@/types/api";
import type { CurrentUser } from "@/types/models";
import { formatMoney, formatRating } from "@/utils/format";
import { getWebUrl } from "@/utils/links";
import NotFound from "./NotFound";

// Inputs keep empty strings; the API uses null to clear optional fields.
type ProfileFormValues = {
  bio: string;
  skills: string;
  hourlyRate: string;
  portfolioUrl: string;
};

const FORM_FIELDS = ["bio", "skills", "hourlyRate", "portfolioUrl"] as const;
const toFormValues = (user: CurrentUser): ProfileFormValues => ({
  bio: user.bio ?? "",
  skills: user.skills.join(", "),
  hourlyRate: user.hourlyRate === null ? "" : String(user.hourlyRate),
  portfolioUrl: user.portfolioUrl ?? "",
});

// Match the directory's exact skill names and remove repeated entries.
const parseSkills = (value: string) => [...new Set(value.split(",").map((skill) => skill.trim().toLowerCase()).filter(Boolean))];

const validateWebLink = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > 255) return "Use no more than 255 characters.";
  return (/^https?:\/\/\S+$/i.test(trimmed) && !!getWebUrl(trimmed)) || "Enter a complete http:// or https:// link.";
};

// App checks the saved session before this page opens.
export default function MyProfile() {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== "FREELANCER") return <NotFound code={403} inline />;
  return <ProfileEditor key={user.id} user={user} />;
}

function ProfileEditor({ user }: { user: CurrentUser }) {
  const updateProfile = useUpdateMyProfile();
  const profileMutations = useIsMutating({ mutationKey: ["profile", user.id] });
  const [saved, setSaved] = useState(false);
  const {
    register, handleSubmit, reset, watch, clearErrors, setError,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({ defaultValues: toFormValues(user) });
  const isSaving = isSubmitting || profileMutations > 0;
  const bio = watch("bio");
  const skills = parseSkills(watch("skills"));
  const profilePath = `/freelancers/${user.id}`;

  const handleSave: SubmitHandler<ProfileFormValues> = async (data) => {
    if (updateProfile.isPending || !isDirty) return;
    clearErrors();
    setSaved(false);

    // PATCH changed fields only; blank inputs remove previous values.
    const body: UpdateProfileBody = {};
    if (dirtyFields.bio) body.bio = data.bio.trim() || null;
    if (dirtyFields.skills) body.skills = parseSkills(data.skills);
    if (dirtyFields.hourlyRate) body.hourlyRate = data.hourlyRate.trim() ? Number(data.hourlyRate) : null;
    if (dirtyFields.portfolioUrl) body.portfolioUrl = data.portfolioUrl.trim() || null;
    if (Object.keys(body).length === 0) return;

    try {
      const updatedUser = await updateProfile.mutateAsync(body);
      // The saved response becomes the new baseline for edits and Discard.
      reset(toFormValues(updatedUser));
      setSaved(true);
    } catch (error) {
      if (isAxiosError<ApiErrorBody>(error)) {
        let focusField = true;
        for (const detail of error.response?.data?.details ?? []) {
          const field = FORM_FIELDS.find((name) => name === detail.field || detail.field.startsWith(`${name}.`));
          if (field) {
            setError(field, { type: "server", message: detail.message }, { shouldFocus: focusField });
            focusField = false;
          }
        }
      }
      // Keep all drafts so the user can correct or retry the request.
      setError("root.server", { message: getErrorMessage(error) });
    }
  };

  const handleDiscard = () => {
    reset(toFormValues(user));
    setSaved(false);
    updateProfile.reset();
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-950 p-7 text-white sm:p-10 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-2 text-lime"><UserIcon className="size-4" />Your profile, your story</p>
          <h1 className="mt-5 font-display text-4xl leading-tight tracking-tight sm:text-5xl">Good work starts<br /><span className="text-lime">with a great introduction.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">Show people what you do, how you work and what makes your perspective different.</p>
        </div>
        <Link to={profilePath} className="btn btn-sm shrink-0 self-start border border-white/25 text-white hover:bg-white/10 lg:self-auto">View public profile<ArrowUpRightIcon className="size-4" /></Link>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {/* Account identity comes from registration, not this PATCH. */}
          <section aria-labelledby="profile-account-heading" className="card p-6 sm:p-8">
            <p className="eyebrow text-brand-700">The essentials</p>
            <h2 id="profile-account-heading" className="mt-2 text-lg font-semibold text-ink">Your account</h2>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <div className="min-w-0"><dt className="text-xs text-gray-500">Name</dt><dd className="mt-1.5 font-semibold text-ink [overflow-wrap:anywhere]">{user.name}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-gray-500">Email <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-[10px]">Private</span></dt><dd className="mt-1.5 text-gray-700 [overflow-wrap:anywhere]">{user.email}</dd></div>
            </dl>
            <AvatarUpload user={user} disabled={isSaving} />
          </section>

          <form noValidate onSubmit={handleSubmit(handleSave)} aria-busy={isSaving} className="card min-w-0 overflow-hidden">
            <fieldset disabled={isSaving} className="min-w-0">
              {/* 1. A short introduction. */}
              <section aria-labelledby="edit-profile-about-heading" className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-xs font-semibold text-brand-800">01</span>
                  <div><h2 id="edit-profile-about-heading" className="text-lg font-semibold text-ink">Tell your story</h2><p className="mt-1 text-sm text-gray-500">A little context helps the right people find you.</p></div>
                </div>
                <div>
                  <label htmlFor="profile-bio" className="field-label">About you</label>
                  <textarea id="profile-bio" rows={6} maxLength={1000} className="input h-auto min-h-40 resize-y py-3 leading-7" placeholder="What do you love working on? Share your experience and approach."
                    aria-invalid={!!errors.bio} aria-describedby={`profile-bio-hint${errors.bio ? " profile-bio-error" : ""}`}
                    {...register("bio", { validate: (value) => value.trim().length <= 1000 || "Use no more than 1,000 characters." })} />
                  <div id="profile-bio-hint" className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500"><span>Focus on the value you bring to a project.</span><span>{bio.length}/1,000</span></div>
                  {errors.bio && <p id="profile-bio-error" className="field-error">{errors.bio.message}</p>}
                </div>
              </section>

              {/* 2. Commas separate skills; empty input removes all skills. */}
              <section aria-labelledby="edit-profile-skills-heading" className="space-y-6 border-t border-gray-200 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-xs font-semibold text-brand-800">02</span>
                  <div><h2 id="edit-profile-skills-heading" className="text-lg font-semibold text-ink">Skills & expertise</h2><p className="mt-1 text-sm text-gray-500">Make it easy to see where you shine.</p></div>
                </div>
                <div>
                  <label htmlFor="profile-skills" className="field-label">Your skills</label>
                  <textarea id="profile-skills" rows={2} className="input h-auto min-h-24 resize-y py-3 leading-7" placeholder="react, typescript, ui design"
                    aria-invalid={!!errors.skills} aria-describedby={`profile-skills-hint${errors.skills ? " profile-skills-error" : ""}`}
                    {...register("skills", { validate: (value) => {
                      const values = parseSkills(value);
                      if (values.length > 20) return "Add up to 20 different skills.";
                      return values.every((skill) => skill.length <= 30) || "Each skill can contain up to 30 characters.";
                    } })} />
                  <p id="profile-skills-hint" className="field-hint">Separate skills with commas. Up to 20 skills, 30 characters each. Repeated skills are combined.</p>
                  {errors.skills && <p id="profile-skills-error" className="field-error">{errors.skills.message}</p>}
                  {skills.length > 0 && <ul aria-label="Skill preview" className="mt-4 flex flex-wrap gap-2">{skills.slice(0, 20).map((skill) => <li key={skill} className="max-w-full rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 [overflow-wrap:anywhere]">{skill}</li>)}</ul>}
                </div>
              </section>

              {/* 3. A blank rate is saved as null, not zero. */}
              <section aria-labelledby="edit-profile-rate-heading" className="space-y-6 border-t border-gray-200 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-xs font-semibold text-brand-800">03</span>
                  <div><h2 id="edit-profile-rate-heading" className="text-lg font-semibold text-ink">Set your rate</h2><p className="mt-1 text-sm text-gray-500">Give clients a starting point for a conversation.</p></div>
                </div>
                <div className="max-w-sm">
                  <label htmlFor="profile-hourly-rate" className="field-label">Hourly rate <span className="font-normal text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <span aria-hidden="true" className="input-icon text-sm">$</span>
                    <input id="profile-hourly-rate" type="text" inputMode="numeric" autoComplete="off" className="input pr-14 pl-9" placeholder="e.g. 35"
                      aria-invalid={!!errors.hourlyRate} aria-describedby={`profile-rate-hint${errors.hourlyRate ? " profile-rate-error" : ""}`}
                      {...register("hourlyRate", { validate: (value) => !value.trim() || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10_000) || "Enter a whole-dollar rate between $1 and $10,000." })} />
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-gray-400">/ hr</span>
                  </div>
                  <p id="profile-rate-hint" className="field-hint">USD · Whole amounts only. Leave blank to hide your rate.</p>
                  {errors.hourlyRate && <p id="profile-rate-error" className="field-error">{errors.hourlyRate.message}</p>}
                </div>
              </section>

              {/* 4. Portfolio link; the photo is saved separately above. */}
              <section aria-labelledby="edit-profile-links-heading" className="space-y-6 border-t border-gray-200 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream text-xs font-semibold text-brand-800">04</span>
                  <div><h2 id="edit-profile-links-heading" className="text-lg font-semibold text-ink">Let your work speak</h2><p className="mt-1 text-sm text-gray-500">Share a portfolio that shows your experience.</p></div>
                </div>
                <div>
                  <label htmlFor="profile-portfolio-url" className="field-label">Portfolio URL</label>
                  <input id="profile-portfolio-url" type="url" inputMode="url" autoComplete="url" maxLength={255} placeholder="https://your-portfolio.com" className="input"
                    aria-invalid={!!errors.portfolioUrl} aria-describedby={`profile-portfolio-hint${errors.portfolioUrl ? " profile-portfolio-error" : ""}`}
                    {...register("portfolioUrl", { validate: validateWebLink })} />
                  <p id="profile-portfolio-hint" className="field-hint">A website that shows your work. Include http:// or https://.</p>
                  {errors.portfolioUrl && <p id="profile-portfolio-error" className="field-error">{errors.portfolioUrl.message}</p>}
                </div>
              </section>
            </fieldset>

            {/* 5. Keep drafts on errors and confirm the saved response. */}
            <footer className="space-y-4 border-t border-gray-200 bg-paper/60 p-6 sm:px-8">
              {errors.root?.server && <p role="alert" className="alert-error">{errors.root.server.message}</p>}
              {saved && !isDirty && <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">Profile saved. Your public profile is up to date.</p>}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <p className="text-xs text-gray-500">{isSaving ? "Saving your profile…" : isDirty ? "You have unsaved changes." : "Make this space your own."}</p>
                <div className="flex flex-wrap gap-3"><button type="button" onClick={handleDiscard} disabled={isSaving || !isDirty} className="btn btn-secondary flex-1 sm:flex-none">Discard changes</button><button type="submit" disabled={isSaving || !isDirty} className="btn btn-primary flex-1 sm:flex-none">{isSaving ? "Saving…" : "Save changes"}<ArrowUpRightIcon className="size-4" /></button></div>
              </div>
            </footer>
          </form>
        </div>

        {/* Saved details stay separate from the editable draft. */}
        <aside aria-label="Your saved profile" className="min-w-0 space-y-6 lg:sticky lg:top-28">
          <section className="card overflow-hidden">
            <div className="bg-cream p-6">
              <p className="eyebrow text-brand-700">The person behind the work</p>
              <Avatar user={user} className="mt-6 size-20 text-2xl" />
              <h2 className="mt-4 font-display text-3xl tracking-tight text-ink [overflow-wrap:anywhere]">{user.name}</h2><p className="mt-2 text-xs text-gray-500">Independent professional</p>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-2">{user.rating !== null && <StarRating value={Number(user.rating.toFixed(1))} size="sm" />}<span className="text-xs font-semibold text-ink">{formatRating(user.rating)}</span><span className="text-xs text-gray-500">· {user.reviewsCount} {user.reviewsCount === 1 ? "review" : "reviews"}</span></div>
              <div className="border-t border-gray-200 pt-5"><p className="flex items-center gap-2 text-xs text-gray-500"><BriefcaseIcon className="size-4" />Saved hourly rate</p><p className="mt-2 font-display text-3xl tracking-tight text-ink">{user.hourlyRate === null ? "Not listed" : formatMoney(user.hourlyRate)}{user.hourlyRate !== null && <span className="ml-1 font-sans text-xs text-gray-400">/ hr</span>}</p></div>
              <Link to={profilePath} className="btn btn-secondary btn-sm w-full">View public profile<ArrowUpRightIcon className="size-4" /></Link>
            </div>
          </section>
          <section className="rounded-2xl border border-gray-200 bg-cream p-6">
            <LayersIcon className="size-5 text-brand-700" /><h2 className="mt-4 font-display text-2xl tracking-tight text-ink">A few thoughtful details.</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-500"><li>Lead with the kind of work you do best.</li><li>Use specific skills clients can search for.</li><li>Let your portfolio show your experience.</li></ul>
            <p className="mt-5 border-t border-gray-200 pt-4 text-xs leading-6 text-gray-500">After saving, your changes appear on your public profile and in the talent directory.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
