import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";

type ModalProps = {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  isBusy?: boolean;
};

// Native dialogs keep keyboard focus inside and restore it when closed.
export default function Modal({ open, title, description, children, onClose, isBusy = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isBusy}
      className="fixed inset-0 m-auto w-[calc(100%_-_2.5rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-float backdrop:bg-gray-900/40 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      onClick={(event) => { if (event.target === event.currentTarget && !isBusy) onClose(); }}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} disabled={isBusy} className="btn btn-ghost size-8 shrink-0 px-0 text-gray-400">
            <CloseIcon className="size-4" />
          </button>
        </div>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-gray-500 [overflow-wrap:anywhere]">{description}</p>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
