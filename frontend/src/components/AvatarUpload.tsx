import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { getErrorMessage } from "@/api/client";
import { useUpdateMyAvatar } from "@/hooks/useFreelancers";
import type { CurrentUser } from "@/types/models";
import Avatar from "./Avatar";

type AvatarUploadProps = { user: CurrentUser; disabled: boolean };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Photo changes save separately so profile text drafts remain untouched.
export default function AvatarUpload({ user, disabled }: AvatarUploadProps) {
  const updateAvatar = useUpdateMyAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Release the old browser URL when replacing a draft or leaving the page.
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setSuccess(""); setError(""); setFile(null);
    if (!IMAGE_TYPES.includes(selected.type)) { event.target.value = ""; setError("Choose a JPEG, PNG or WebP image."); return; }
    if (selected.size === 0 || selected.size > 5 * 1024 * 1024) { event.target.value = ""; setError("Choose a non-empty image no larger than 5 MB."); return; }
    setFile(selected);
  };
  const handleSave = async (nextFile: File | null) => {
    if (disabled || updateAvatar.isPending) return;
    setError(""); setSuccess("");
    try {
      await updateAvatar.mutateAsync(nextFile);
      clearFile();
      setSuccess(nextFile ? "Photo saved. Your new avatar is visible on your profile." : "Photo removed. Your initials will appear instead.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  };

  return (
    <section aria-labelledby="avatar-upload-heading" className="mt-6 border-t border-gray-200 pt-6">
      <h3 id="avatar-upload-heading" className="text-sm font-semibold text-ink">Profile photo</h3>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        {preview ? <img src={preview} alt="Preview of your selected profile photo" className="size-24 shrink-0 rounded-full bg-cream object-cover" onError={() => { clearFile(); setError("This image could not be opened. Choose another file."); }} /> : <Avatar user={user} linked={false} className="size-24 text-3xl" />}
        <div className="min-w-0 flex-1 space-y-3">
          <label htmlFor="profile-avatar-file" className="field-label">Choose an image</label>
          <input ref={inputRef} id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChoose} disabled={disabled} aria-invalid={!!error} aria-describedby={`avatar-file-hint${error ? " avatar-file-error" : ""}`} className="block w-full min-w-0 text-xs text-gray-500 outline-none file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-gray-200 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-brand-700 hover:file:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60" />
          <p id="avatar-file-hint" className="text-xs leading-5 text-gray-500">JPEG, PNG or WebP · Up to 5 MB and 16 megapixels. Your photo is saved as a square avatar.</p>
          <div className="flex flex-wrap gap-2">
            {file && <><button type="button" onClick={() => { void handleSave(file); }} disabled={disabled} className="btn btn-secondary btn-sm">{updateAvatar.isPending ? "Saving photo…" : "Save photo"}</button><button type="button" onClick={() => { clearFile(); setError(""); }} disabled={disabled} className="btn btn-ghost btn-sm">Cancel selection</button></>}
            {!file && user.avatarUrl && <button type="button" onClick={() => { void handleSave(null); }} disabled={disabled} className="btn btn-ghost btn-sm text-red-600">{updateAvatar.isPending ? "Removing photo…" : "Remove photo"}</button>}
          </div>
        </div>
      </div>
      {error && <p id="avatar-file-error" role="alert" className="field-error mt-3">{error}</p>}
      {success && <p role="status" className="mt-3 text-sm text-brand-700">{success}</p>}
    </section>
  );
}
