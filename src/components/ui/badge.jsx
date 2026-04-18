import { cn } from "../../lib/utils";

const variantClasses = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-800",
  outline: "border border-slate-200 bg-white text-slate-700",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition",
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  );
}
