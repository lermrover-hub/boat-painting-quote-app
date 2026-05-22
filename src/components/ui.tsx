import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "bg-teal-700 text-white active:bg-teal-800",
    secondary: "bg-white text-slate-900 border border-slate-300 active:bg-slate-100",
    danger: "bg-red-600 text-white active:bg-red-700",
    ghost: "bg-transparent text-slate-700 active:bg-slate-100"
  };
  return (
    <button
      {...props}
      className={`min-h-12 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function NumberInput({
  value,
  onChange,
  step = "0.01",
  min = "0"
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: string;
}) {
  return (
    <input
      className={inputClass}
      inputMode="decimal"
      min={min}
      step={step}
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </header>
  );
}
