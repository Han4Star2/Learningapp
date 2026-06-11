import { clsx } from "./clsx";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
        props.className
      )}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-transparent text-red-600 hover:bg-red-50",
  };
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className
      )}
    />
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg border border-gray-200 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}
