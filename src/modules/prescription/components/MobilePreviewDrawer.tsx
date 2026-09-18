import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const MobilePreviewDrawer = ({ open, onClose, title, children }: Props) => {
  // Lock scroll while open + handle Esc key
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden print:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — full-screen */}
      <div className="absolute inset-0 flex flex-col bg-paper animate-in slide-in-from-bottom-4 duration-200">
        {/* Top bar */}
        <div className="shrink-0 border-b border-ink-soft bg-paper px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
              Visualizar documento
            </div>
            <div className="font-serif text-base font-semibold text-ink truncate">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-soft bg-card text-ink-muted hover:bg-paper-alt"
            aria-label="Voltar para editar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content fills remaining height */}
        <div className="flex-1 overflow-hidden p-3">
          <div className="h-full">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreviewDrawer;
