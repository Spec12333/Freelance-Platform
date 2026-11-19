import { Link } from "react-router-dom";
import { getAvatarUrl } from "@/utils/links";

type AvatarProps = {
  user: { id: number; name: string; avatarUrl?: string | null };
  className?: string;
  linked?: boolean;
};

// Use one image fallback and one profile-link behavior across the site.
export default function Avatar({ user, className = "size-11 text-sm", linked = true }: AvatarProps) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const avatar = getAvatarUrl(user.avatarUrl ?? null);
  const classes = `relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-cream font-semibold text-brand-800 ${className}`;
  const content = <><span aria-hidden="true">{initials}</span>{avatar && <img key={avatar.href} src={avatar.href} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}</>;

  return linked
    ? <Link to={`/freelancers/${user.id}`} aria-label={`View ${user.name}'s profile`} className={`${classes} outline-none transition hover:ring-2 hover:ring-brand-300 focus-visible:ring-4 focus-visible:ring-brand-600/25`}>{content}</Link>
    : <span aria-hidden="true" className={classes}>{content}</span>;
}
