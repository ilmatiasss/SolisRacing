import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const controlBase = cn(
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-fg shadow-xs transition-colors",
  "placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/20",
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        controlBase,
        "h-11 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23a1a1aa' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  htmlFor,
  children,
  optional,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-fg", className)}>
      {children}
      {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string | string[] }) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-500">
      {text}
    </p>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}

/** Campo con label, control y mensaje de error. */
export function Field({
  label,
  htmlFor,
  optional,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  optional?: boolean;
  error?: string | string[];
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && !error && <FieldHint>{hint}</FieldHint>}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

export function Checkbox({
  className,
  label,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-line-strong accent-brand-600"
        {...props}
      />
      <span className="text-sm">
        <span className="font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-muted">{description}</span>}
      </span>
    </label>
  );
}
