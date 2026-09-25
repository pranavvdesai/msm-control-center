"use client";

import { cn } from "@/lib/utils";

export function GlowButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-red-600/80 text-white hover:bg-red-600",
  };

  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
