import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import AdminHeader from "@/components/admin/AdminHeader";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { ChevronDownIcon, CloseIcon, RefreshIcon, SearchIcon, ShieldIcon } from "@/components/ui/icons";
import { useBlockUsers, useGetUsers } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth";
import type { CurrentUser, Role } from "@/types/models";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 10;
const ROLE_LABELS: Record<Role, string> = { CLIENT: "Client", FREELANCER: "Freelancer", ADMIN: "Administrator" };

export default function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const refreshRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState("");
  const blockUser = useBlockUsers();

  // 1. Search drafts wait 400 ms; Enter applies immediately.
  const search = (searchParams.get("search") ?? "").trim();
  const [searchInput, setSearchInput] = useState(search);
  const applySearch = useCallback((value: string) => {
    if (value.trim().length > 100) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value.trim()) next.set("search", value.trim()); else next.delete("search");
      next.set("page", "1");
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  useEffect(() => { setSearchInput(search); }, [search, location.key]);
  useEffect(() => {
    if (searchInput.trim() === search || searchInput.trim().length > 100) return;
    const timer = window.setTimeout(() => applySearch(searchInput), 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, location.key, applySearch]);

  // 2. Role and access filters include a pending search in the same update.
  const roleParam = searchParams.get("role");
  const role = roleParam && Object.hasOwn(ROLE_LABELS, roleParam) ? roleParam as Role : undefined;
  const accessParam = searchParams.get("isBlocked");
  const isBlocked = accessParam === "true" ? true : accessParam === "false" ? false : undefined;
  const updateFilter = (key: "role" | "isBlocked", value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value); else next.delete(key);
      if (searchInput.trim()) next.set("search", searchInput.trim()); else next.delete("search");
      next.set("page", "1");
      return next;
    });
  };

  // 3. Reject invalid pages and correct pages emptied by a filtered mutation.
  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && Number.isSafeInteger((parsedPage - 1) * PAGE_SIZE) ? parsedPage : 1;
  const updatePage = useCallback((value: number, replace = false) => {
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set("page", String(value)); return next; }, { replace });
  }, [setSearchParams]);
  useEffect(() => {
    const invalidPage = pageParam !== null && pageParam !== String(page);
    const invalidRole = roleParam !== null && !role;
    const invalidAccess = accessParam !== null && isBlocked === undefined;
    if (!invalidPage && !invalidRole && !invalidAccess) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (invalidPage) next.set("page", String(page));
      if (invalidRole) next.delete("role");
      if (invalidAccess) next.delete("isBlocked");
      return next;
    }, { replace: true });
  }, [pageParam, page, roleParam, role, accessParam, isBlocked, setSearchParams]);

  const urlError = search.length > 100;
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useGetUsers({ page, limit: PAGE_SIZE, search: search || undefined, role, isBlocked }, { enabled: !urlError });
  useEffect(() => {
    if (data && !isFetching && !isPlaceholderData && !isError && !urlError && page > data.pages) updatePage(data.pages, true);
  }, [data, isFetching, isPlaceholderData, isError, urlError, page, updatePage]);

  const isDebouncing = searchInput.trim() !== search;
  const isUpdating = isFetching || isDebouncing;
  const locked = isUpdating || isPlaceholderData || blockUser.isPending || isError;
  const hasFilters = Boolean(search || role || isBlocked !== undefined);
  const accessError = isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
  const resetFilters = () => {
    setSearchInput("");
    setSearchParams((current) => { const next = new URLSearchParams(current); for (const key of ["search", "role", "isBlocked"]) next.delete(key); next.set("page", "1"); return next; });
  };
  const closeDialog = () => { if (!blockUser.isPending) { setSelected(null); blockUser.reset(); } };
  const handleConfirm = async () => {
    if (!selected || selected.id === currentUser?.id || blockUser.isPending) return;
    try {
      const updated = await blockUser.mutateAsync({ id: selected.id, isBlocked: !selected.isBlocked });
      setMessage(`${updated.name} ${updated.isBlocked ? "has been blocked" : "can access the platform again"}.`);
      setSelected(null);
      window.requestAnimationFrame(() => refreshRef.current?.focus());
    } catch { /* Keep the server error inside the confirmation dialog. */ }
  };

  return (
    <div className="space-y-7">
      <AdminHeader title="A community worth building." description="Find the people behind the work and manage access to the marketplace." total={urlError || isError ? undefined : data?.total} totalLabel={isPlaceholderData ? "Updating accounts…" : hasFilters ? "matching accounts" : "community members"} />

      <section aria-label="Search and filter users" className="card p-5 sm:p-7">
        <form role="search" onSubmit={(event) => { event.preventDefault(); applySearch(searchInput); }}>
          <label htmlFor="admin-user-search" className="sr-only">Search users by name or email</label>
          <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-gray-200 bg-paper p-2 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/10 sm:flex-nowrap"><SearchIcon className="ml-2 size-5 shrink-0 text-gray-400" /><input id="admin-user-search" type="search" maxLength={100} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by name or email…" aria-invalid={searchInput.trim().length > 100 || urlError} aria-describedby={searchInput.trim().length > 100 || urlError ? "admin-user-search-error" : undefined} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:appearance-none" />{searchInput && <button type="button" aria-label="Clear user search" onClick={() => { setSearchInput(""); applySearch(""); }} className="btn btn-ghost size-9 shrink-0 px-0"><CloseIcon className="size-4" /></button>}<button type="submit" className="btn btn-primary w-full shrink-0 sm:w-auto">Find people<SearchIcon className="size-4" /></button></div>
          {(searchInput.trim().length > 100 || urlError) && <p id="admin-user-search-error" role="alert" className="field-error">Use no more than 100 characters.</p>}
        </form>
        <div className="mt-5 grid items-end gap-4 border-t border-gray-200 pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div><label htmlFor="admin-user-role" className="field-label">Role</label><div className="relative"><select id="admin-user-role" value={role ?? ""} onChange={(event) => updateFilter("role", event.target.value)} className="input pr-10"><option value="">All roles</option>{(Object.keys(ROLE_LABELS) as Role[]).map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}</select><ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" /></div></div>
          <div><label htmlFor="admin-user-access" className="field-label">Account access</label><div className="relative"><select id="admin-user-access" value={isBlocked === undefined ? "" : String(isBlocked)} onChange={(event) => updateFilter("isBlocked", event.target.value)} className="input pr-10"><option value="">All accounts</option><option value="false">Active</option><option value="true">Blocked</option></select><ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400" /></div></div>
          <button type="button" onClick={resetFilters} disabled={!hasFilters && !searchInput} className="btn btn-ghost text-gray-500"><RefreshIcon className="size-4" />Reset filters</button>
        </div>
      </section>

      {message && <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-800">{message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-gray-500">{isUpdating ? "Updating accounts…" : data && !urlError ? `Showing ${data.items.length} of ${data.total} · Oldest accounts first` : "Community accounts"}</p><button ref={refreshRef} type="button" onClick={() => { void refetch(); }} disabled={isUpdating || blockUser.isPending || urlError} className="btn btn-secondary btn-sm"><RefreshIcon className="size-4" />Refresh</button></div>

      {urlError ? <p role="status" className="text-sm text-gray-500">Shorten the search above to load matching accounts.</p>
        : !data || accessError ? isPending ? <div className="card p-10"><Spinner label="Loading community accounts…" /></div> : <ErrorMessage title="We couldn't load users" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} />
          : <>
            {isError && <p role="alert" className="alert-error">We couldn't refresh the list. Showing the last loaded accounts. {getErrorMessage(error)}</p>}
            <section aria-label="User accounts" aria-busy={isUpdating} className={isPlaceholderData ? "opacity-60" : ""}>
              {data.items.length === 0 ? <EmptyState title={hasFilters ? "No accounts match these filters." : "No accounts to show."} description="Try another name, email or account filter." action={hasFilters ? { label: "Clear all filters", onClick: resetFilters } : undefined} /> : <div className="card overflow-hidden"><table className="block w-full text-left text-sm md:table md:table-fixed"><caption className="sr-only">Community accounts and access controls</caption><thead className="hidden border-b border-gray-200 bg-paper text-xs text-gray-500 md:table-header-group"><tr><th scope="col" className="w-[36%] px-5 py-4">Person</th><th scope="col" className="w-[16%] px-3 py-4">Role</th><th scope="col" className="w-[14%] px-3 py-4">Access</th><th scope="col" className="w-[18%] px-3 py-4">Joined</th><th scope="col" className="w-[16%] px-5 py-4 text-right">Action</th></tr></thead><tbody className="block md:table-row-group">{data.items.map((user) => <tr key={user.id} data-user-id={user.id} className="grid grid-cols-2 items-center gap-4 border-b border-gray-100 p-5 last:border-b-0 md:table-row md:p-0">
                <td className="col-span-2 min-w-0 md:px-5 md:py-5"><div className="flex min-w-0 items-center gap-3"><Avatar user={user} /><div className="min-w-0"><Link to={`/freelancers/${user.id}`} className="rounded font-semibold text-ink outline-none hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20 [overflow-wrap:anywhere]">{user.name}</Link>{user.id === currentUser?.id && <span className="ml-2 text-[10px] text-brand-700">You</span>}<p className="mt-1 text-xs text-gray-500 [overflow-wrap:anywhere]">{user.email}</p></div></div></td>
                <td className="min-w-0 md:px-3 md:py-5"><span className="mb-1 block text-[10px] text-gray-400 md:hidden">Role</span><span className="text-xs text-gray-600">{ROLE_LABELS[user.role]}</span></td>
                <td className="md:px-3 md:py-5"><span className="mb-1 block text-[10px] text-gray-400 md:hidden">Access</span><span className={`badge ${user.isBlocked ? "bg-red-50 text-red-700 ring-red-600/20" : "bg-brand-50 text-brand-700 ring-brand-600/20"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td>
                <td className="md:px-3 md:py-5"><span className="mb-1 block text-[10px] text-gray-400 md:hidden">Joined</span><time dateTime={user.createdAt} className="text-xs text-gray-500">{formatDate(user.createdAt)}</time></td>
                <td className="text-right md:px-5 md:py-5">{user.id === currentUser?.id ? <span className="text-xs text-gray-400">Your account</span> : <button type="button" disabled={locked} onClick={() => { blockUser.reset(); setSelected(user); }} aria-label={`${user.isBlocked ? "Unblock" : "Block"} ${user.name}`} className={`btn btn-sm ${user.isBlocked ? "btn-secondary text-brand-700" : "btn-ghost text-red-600"}`}>{user.isBlocked ? "Unblock" : "Block"}</button>}</td>
              </tr>)}</tbody></table></div>}
            </section>
            <Pagination page={data.page} pages={data.pages} onPageChange={updatePage} disabled={isUpdating || isPlaceholderData || blockUser.isPending} ariaLabel="Users pagination" />
          </>}

      <Modal open={selected !== null} title={selected?.isBlocked ? "Restore account access?" : "Block this account?"} description={selected ? selected.isBlocked ? `${selected.name} will be able to sign in and use the marketplace again.` : `${selected.name} will lose access to the marketplace and active chat connections. Their projects and history will remain.` : ""} onClose={closeDialog} isBusy={blockUser.isPending}>
        {selected && <div className="mt-6 space-y-5"><div className="flex items-center gap-3 rounded-xl bg-paper p-4"><ShieldIcon className="size-5 shrink-0 text-brand-700" /><p className="min-w-0 text-sm text-gray-600 [overflow-wrap:anywhere]">{selected.email}</p></div>{blockUser.isError && <p role="alert" className="alert-error">{getErrorMessage(blockUser.error)}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={closeDialog} disabled={blockUser.isPending} className="btn btn-secondary">Cancel</button><button type="button" onClick={() => { void handleConfirm(); }} disabled={blockUser.isPending || selected.id === currentUser?.id} className={`btn ${selected.isBlocked ? "btn-primary" : "btn-danger"}`}>{blockUser.isPending ? "Saving…" : selected.isBlocked ? "Unblock account" : "Block account"}</button></div></div>}
      </Modal>
    </div>
  );
}
