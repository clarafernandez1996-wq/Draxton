"use client";

import { ReactNode, useEffect } from "react";

type EntityModalProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function EntityModal({ title, open, onOpenChange, children, footer }: EntityModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0B3A6E]">{title}</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border px-3 py-1 text-sm text-[#0B3A6E] hover:bg-[#EAF2FB] transition"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t px-5 py-4">{footer}</div> : null}
      </div>
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 -z-10 cursor-default"
        onClick={() => onOpenChange(false)}
      />
    </div>
  );
}
