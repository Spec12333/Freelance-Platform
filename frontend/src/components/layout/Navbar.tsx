// Role-aware menu (CLIENT/FREELANCER/ADMIN), unseen-proposals badge, logout.

import { Link, NavLink } from "react-router-dom";
import Logo from "@/components/ui/Logo";
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

// "Karen Petrosyan" -> "KP"
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-2.5 py-2 text-sm sm:px-3 font-semibold whitespace-nowrap transition outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      {/* On phones the nav drops to a second, horizontally scrollable row. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-5 sm:gap-x-6 sm:px-8">
        <Link
          to={"/"}
          className="flex h-16 shrink-0 items-center rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main"
          className="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-3 lg:order-none lg:mx-0 lg:w-auto lg:p-0"
        >
          {NAV_ITEMS[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={linkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex h-16 items-center gap-2 sm:gap-3">
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

          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
            >
              {getInitials(user.name)}
            </span>
            <div className="hidden leading-tight lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>

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
