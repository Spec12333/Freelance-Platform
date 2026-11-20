import { isAxiosError } from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getErrorMessage } from "@/api/client";
import { useCreateCategory, useRenameCategory } from "@/hooks/useAdmin";
import type { ApiErrorBody, CategoryWithCount } from "@/types/api";

type CategoryFormProps = { category?: CategoryWithCount; onCancel: () => void; onSaved: (name: string) => void };

// Creation and renaming share validation; the parent owns the dialog.
export default function CategoryForm({ category, onCancel, onSaved }: CategoryFormProps) {
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const { register, handleSubmit, setError, setFocus, formState: { errors, isDirty, isSubmitting } } = useForm<{ name: string }>({ defaultValues: { name: category?.name ?? "" } });
  const isSaving = isSubmitting || createCategory.isPending || renameCategory.isPending;

  // Wait until the parent native dialog has opened before moving focus.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFocus("name"));
    return () => window.cancelAnimationFrame(frame);
  }, [setFocus]);

  const handleSave = async ({ name }: { name: string }) => {
    if (createCategory.isPending || renameCategory.isPending) return;
    try {
      const saved = category ? await renameCategory.mutateAsync({ id: category.id, name: name.trim() }) : await createCategory.mutateAsync(name.trim());
      onSaved(saved.name);
    } catch (error) {
      if (isAxiosError<ApiErrorBody>(error)) {
        const detail = error.response?.data?.details?.find((item) => item.field === "name");
        if (detail) setError("name", { type: "server", message: detail.message }, { shouldFocus: true });
      }
      setError("root.server", { message: getErrorMessage(error) });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleSave)} className="mt-6 space-y-5" aria-busy={isSaving}>
      <div><label htmlFor="admin-category-name" className="field-label">Category name</label><input id="admin-category-name" autoFocus maxLength={50} disabled={isSaving} className="input" placeholder="e.g. Web development" aria-invalid={!!errors.name} aria-describedby={`category-name-hint${errors.name ? " category-name-error" : ""}`} {...register("name", { validate: (value) => {
        const name = value.trim();
        if (name.length < 2 || name.length > 50) return "Use between 2 and 50 characters.";
        return /[a-z0-9]/i.test(name) || "Include at least one Latin letter or number.";
      } })} /><p id="category-name-hint" className="field-hint">2–50 characters. Include at least one Latin letter or number.</p>{errors.name && <p id="category-name-error" className="field-error">{errors.name.message}</p>}</div>
      {errors.root?.server && <p role="alert" className="alert-error">{errors.root.server.message}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={onCancel} disabled={isSaving} className="btn btn-secondary">Cancel</button><button type="submit" disabled={isSaving || (!!category && !isDirty)} className="btn btn-primary">{isSaving ? "Saving…" : category ? "Save changes" : "Create category"}</button></div>
    </form>
  );
}
