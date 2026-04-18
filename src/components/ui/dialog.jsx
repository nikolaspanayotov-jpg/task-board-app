import { createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

const DialogContext = createContext(null);

export function Dialog({ open, onOpenChange, children }) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogContent({ className, children, ...props }) {
  const context = useContext(DialogContext);

  useEffect(() => {
    if (!context?.open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        context.onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [context]);

  if (!context?.open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => context.onOpenChange(false)}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold text-slate-900", className)} {...props} />;
}
