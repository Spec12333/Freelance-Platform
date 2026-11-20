import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "@/api/client";
import AdminHeader from "@/components/admin/AdminHeader";
import CategoryForm from "@/components/admin/CategoryForm";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { LayersIcon, PlusIcon, RefreshIcon } from "@/components/ui/icons";
import { useAdminCategories, useDeleteCategory } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth";
import type { CategoryWithCount } from "@/types/api";

type CategoryDialog = { mode: "create" } | { mode: "rename" | "delete"; category: CategoryWithCount };
const PAGE_SIZE = 10;

export default function AdminCategories() {
  const userId = useAuthStore((state) => state.user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<CategoryDialog | null>(null);
  const [message, setMessage] = useState("");
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCategory = useDeleteCategory();
  const isSaving = useIsMutating({ mutationKey: ["admin", "categories", userId] }) > 0;

  // Keep pagination in the URL and normalize malformed values.
  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && Number.isSafeInteger((parsedPage - 1) * PAGE_SIZE) ? parsedPage : 1;
  const updatePage = useCallback((value: number, replace = false) => {
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set("page", String(value)); return next; }, { replace });
  }, [setSearchParams]);
  useEffect(() => { if (pageParam !== null && pageParam !== String(page)) updatePage(page, true); }, [pageParam, page, updatePage]);
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = useAdminCategories({ page, limit: PAGE_SIZE });
  useEffect(() => {
    // Deleting the last row on a page can move us to the previous page.
    if (data && !isFetching && !isPlaceholderData && !isError && page > data.pages) updatePage(data.pages, true);
  }, [data, isFetching, isPlaceholderData, isError, page, updatePage]);

  const locked = isFetching || isPlaceholderData || isSaving || isError;
  const accessError = isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
  const closeDialog = () => { if (!isSaving) { setDialog(null); deleteCategory.reset(); } };
  const selected = dialog && dialog.mode !== "create" ? data?.items.find((category) => category.id === dialog.category.id) ?? dialog.category : undefined;
  const afterSave = (text: string) => {
    setMessage(text);
    setDialog(null);
    window.requestAnimationFrame(() => createButtonRef.current?.focus());
  };
  const handleDelete = async () => {
    if (!selected || selected.ordersCount > 0 || isSaving) return;
    try {
      await deleteCategory.mutateAsync(selected.id);
      afterSave(`Category “${selected.name}” deleted.`);
    } catch { /* A conflict refreshes usage counts and stays visible in the dialog. */ }
  };
  const openDialog = (next: CategoryDialog) => { deleteCategory.reset(); setDialog(next); };

  return (
    <div className="space-y-7">
      <AdminHeader title="A place for every kind of work." description="Organize the expertise that connects great ideas with the right people." total={isError ? undefined : data?.total} totalLabel={isPlaceholderData ? "Updating categories…" : "project categories"} action={<button ref={createButtonRef} type="button" onClick={() => openDialog({ mode: "create" })} disabled={isSaving} className="btn bg-lime text-brand-950 hover:bg-brand-200"><PlusIcon className="size-4" />New category</button>} />
      {message && <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-800 [overflow-wrap:anywhere]">{message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-brand-700">Keep the marketplace clear</p><h2 className="mt-3 font-display text-3xl tracking-tight text-ink">Categories & expertise.</h2><p role="status" className="mt-2 text-xs text-gray-500">{isFetching ? "Updating categories…" : data ? `Showing ${data.items.length} of ${data.total} · Sorted by name` : "Project categories"}</p></div><button type="button" onClick={() => { void refetch(); }} disabled={isFetching || isSaving} className="btn btn-secondary btn-sm"><RefreshIcon className="size-4" />Refresh</button></div>

      {!data || accessError ? isPending ? <div className="card p-10"><Spinner label="Loading categories…" /></div> : <ErrorMessage title="We couldn't load categories" message={getErrorMessage(error)} onRetry={() => { void refetch(); }} /> : <>
        {isError && <p role="alert" className="alert-error">We couldn't refresh the list. Showing the last loaded categories. {getErrorMessage(error)}</p>}
        <section aria-label="Project categories" aria-busy={isFetching} className={isPlaceholderData ? "opacity-60" : ""}>
          {data.items.length === 0 ? <EmptyState title="Make room for the first idea." description="Create a category so clients can organize their projects and freelancers can find relevant work." /> : <div className="card overflow-hidden"><table className="block w-full text-left text-sm md:table md:table-fixed"><caption className="sr-only">Categories, project usage and administration actions</caption><thead className="hidden border-b border-gray-200 bg-paper text-xs text-gray-500 md:table-header-group"><tr><th scope="col" className="w-[50%] px-6 py-4">Category</th><th scope="col" className="w-[20%] px-4 py-4">Project usage</th><th scope="col" className="w-[30%] px-6 py-4 text-right">Actions</th></tr></thead><tbody className="block md:table-row-group">{data.items.map((category) => <tr key={category.id} data-category-id={category.id} className="grid gap-4 border-b border-gray-100 p-5 last:border-b-0 md:table-row md:p-0">
            <td className="min-w-0 md:px-6 md:py-5"><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream text-brand-700"><LayersIcon className="size-5" /></span><div className="min-w-0"><p className="font-semibold text-ink [overflow-wrap:anywhere]">{category.name}</p><p className="mt-1 text-xs text-gray-400 [overflow-wrap:anywhere]">{category.slug}</p></div></div></td>
            <td className="md:px-4 md:py-5"><p className="text-sm text-gray-600">{category.ordersCount} {category.ordersCount === 1 ? "project" : "projects"}</p><p className={`mt-1 text-xs ${category.ordersCount > 0 ? "text-gray-400" : "text-brand-700"}`}>{category.ordersCount > 0 ? "In use · Cannot be deleted" : "Unused · Can be deleted"}</p></td>
            <td className="md:px-6 md:py-5"><div className="flex flex-wrap gap-2 md:justify-end"><button type="button" aria-label={`Rename category ${category.name}`} disabled={locked} onClick={() => openDialog({ mode: "rename", category })} className="btn btn-secondary btn-sm">Rename</button><button type="button" aria-label={`Delete category ${category.name}`} title={category.ordersCount > 0 ? "This category is used by projects and cannot be deleted" : undefined} disabled={locked || category.ordersCount > 0} onClick={() => openDialog({ mode: "delete", category })} className="btn btn-ghost btn-sm text-red-600">Delete</button></div></td>
          </tr>)}</tbody></table></div>}
        </section>
        <Pagination page={data.page} pages={data.pages} onPageChange={updatePage} disabled={isFetching || isPlaceholderData || isSaving} ariaLabel="Categories pagination" />
      </>}

      <Modal open={dialog !== null} title={dialog?.mode === "create" ? "Create a category" : dialog?.mode === "rename" ? "Rename this category" : "Delete this category?"} description={dialog?.mode === "create" ? "Give clients a clear way to describe the kind of work they need." : dialog?.mode === "rename" ? "The new name will also appear on projects already using this category." : `“${selected?.name ?? "This category"}” will be permanently removed. Categories can only be deleted while no projects use them.`} onClose={closeDialog} isBusy={isSaving}>
        {dialog?.mode === "create" && <CategoryForm key="create" onCancel={closeDialog} onSaved={(name) => afterSave(`Category “${name}” created.`)} />}
        {dialog?.mode === "rename" && <CategoryForm key={dialog.category.id} category={dialog.category} onCancel={closeDialog} onSaved={(name) => afterSave(`Category renamed to “${name}”.`)} />}
        {dialog?.mode === "delete" && <div className="mt-6 space-y-5">{deleteCategory.isError && <p role="alert" className="alert-error">{getErrorMessage(deleteCategory.error)}</p>}{selected && selected.ordersCount > 0 && <p role="status" className="text-sm text-gray-500">This category is now in use. It can no longer be deleted.</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={closeDialog} disabled={isSaving} className="btn btn-secondary">Cancel</button><button type="button" onClick={() => { void handleDelete(); }} disabled={isSaving || !selected || selected.ordersCount > 0} className="btn btn-danger">{isSaving ? "Deleting…" : "Delete category"}</button></div></div>}
      </Modal>
    </div>
  );
}
