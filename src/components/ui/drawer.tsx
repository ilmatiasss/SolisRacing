"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Panel lateral accesible basado en <dialog> (trampa de foco y Escape nativos). */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className,
  theme = "store",
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  theme?: "store" | "admin";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clic en el fondo oscuro (fuera del panel) cierra el panel.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        theme === "store" ? "theme-store" : "theme-admin",
        "fixed inset-y-0 m-0 h-dvh max-h-none w-full max-w-md bg-transparent p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        side === "right" ? "right-0 left-auto" : "right-auto left-0",
        className,
      )}
    >
      <div className="flex h-full flex-col border-line bg-bg shadow-2xl sm:border-l">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-fg/5 hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line p-5">{footer}</div>}
      </div>
    </dialog>
  );
}
