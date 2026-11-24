'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type DialogProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  // false while something is being sent: Escape, the close button and a click outside do nothing
  dismissible?: boolean;
  closeOnOutsideClick?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

// A modal dialog built on the native <dialog> and showModal(), which give for free: the top layer,
// an inert background (Tab can't leave the dialog), Escape and the ::backdrop.
// It's open while it's rendered: the parent mounts it to open it and unmounts it to close it
export function Dialog({
  title,
  description,
  children,
  footer,
  onClose,
  dismissible = true,
  closeOnOutsideClick = true,
  size = 'md',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    // Where focus was before opening: usually the button that opened the dialog
    const trigger = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    // showModal() focuses the first focusable element (the close button). A field marked with
    // data-autofocus takes it instead, so the cashier can start typing right away
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      dialog?.close();
      // Give focus back to the trigger, so keyboard and screen reader users don't lose their place
      trigger?.focus();
    };
  }, []);

  function requestClose() {
    if (dismissible) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape fires "cancel": we close through React state instead of letting the browser close it
      onCancel={event => {
        event.preventDefault();
        requestClose();
      }}
      // A click on the <dialog> itself (not on its content) is a click on the backdrop
      onClick={event => {
        if (closeOnOutsideClick && event.target === event.currentTarget) requestClose();
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${SIZES[size]} flex-col rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40 open:flex`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          {description && <div id={descriptionId} className="mt-1 text-sm text-slate-600">{description}</div>}
        </div>
        <button
          type="button"
          onClick={requestClose}
          disabled={!dismissible}
          aria-label="Cerrar"
          className="-mr-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          ✕
        </button>
      </header>
      {/* Only the body scrolls: the title and the actions stay visible */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer && <footer className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</footer>}
    </dialog>
  );
}
