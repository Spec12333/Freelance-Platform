// Role-aware menu (CLIENT/FREELANCER/ADMIN), unseen-proposals badge, logout.

import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import Avatar from "@/components/Avatar";
import { LogoutIcon, PlusIcon } from "@/components/ui/icons";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/types/models";
import { queryClient } from "@/api/queryClient";
type NavItem = { label: string; to: string };

const NAV_ITEMS: Record<Role, NavItem[]> = {
  CLIENT: [
    { label: "Dashboard", to: "/" },
    { label: "Orders", to: "/orders" },
    { label: "Freelancers", to: "/freelancers" },
  ],
  FREELANCER: [
    { label: "Dashboard", to: "/" },
    { label: "Find work", to: "/orders" },
    { label: "Freelancers", to: "/freelancers" },
    { label: "My Profile", to: "/profile" },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/" },
    { label: "Users", to: "/admin/users" },
    { label: "Categories", to: "/admin/categories" },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Client",
  FREELANCER: "Freelancer",
  ADMIN: "Admin",
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-2.5 py-3 text-sm sm:px-3 font-semibold whitespace-nowrap transition outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 ${
    isActive
      ? "border-brand-600 text-brand-700"
      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"
  }`;

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { pathname } = useLocation();

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  if (!user) {
    return null;
  }

  // Viewing the public profile and editing it are separate routes.
  const publicProfilePath = `/freelancers/${user.id}`;
  const isOwnPublicProfile = pathname.replace(/\/+$/, "") === publicProfilePath;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white">Skip to content</a>
      {/* On phones the nav drops to a second, horizontally scrollable row. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 px-5 sm:gap-x-6 sm:px-10">
        <Link
          to={"/"}
          className="flex h-20 shrink-0 items-center rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main"
          className="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 lg:order-none lg:mx-0 lg:w-auto lg:p-0"
        >
          {NAV_ITEMS[user.role].map((item) => {
            const isMyProfile = item.to === "/profile";
            return (
              <NavLink
                key={item.to}
                to={isMyProfile ? publicProfilePath : item.to}
                end={item.to === "/" || (item.to === "/freelancers" && isOwnPublicProfile && user.role === "FREELANCER")}
                className={({ isActive }) => linkClass({ isActive: isActive || (isMyProfile && pathname === "/profile") })}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex h-20 items-center gap-2 sm:gap-3">
          {user.role === "CLIENT" && (
            <>
              <Link
                to="/orders/new"
                className="btn btn-primary btn-sm"
                aria-label="Post an order"
              >
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Post an order</span>
              </Link>
              <span
                aria-hidden="true"
                className="hidden h-6 w-px bg-gray-200 sm:block"
              />
            </>
          )}

          <Link to={publicProfilePath} aria-label="View your public profile" className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
            <Avatar user={user} linked={false} className="size-9 text-sm" />
            <div className="hidden leading-tight lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost btn-sm px-2.5 text-gray-500"
            aria-label="Log out"
          >
            <LogoutIcon className="size-5" />
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
