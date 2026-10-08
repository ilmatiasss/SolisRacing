import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_8px_24px_-12px_rgb(225_6_0/0.8)] hover:bg-brand-500 active:bg-brand-700",
  secondary: "bg-fg text-bg hover:opacity-90",
  outline: "border border-line-strong bg-transparent text-fg hover:border-fg/60 hover:bg-fg/5",
  ghost: "bg-transparent text-fg hover:bg-fg/8",
  danger: "bg-red-600/10 text-red-500 ring-1 ring-inset ring-red-600/30 hover:bg-red-600/20",
  light: "bg-white text-zinc-900 hover:bg-zinc-200",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-5 text-sm",
  lg: "h-13 gap-2.5 rounded-xl px-7 text-base",
  icon: "size-10 rounded-xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
