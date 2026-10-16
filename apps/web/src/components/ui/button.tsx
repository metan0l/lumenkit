import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-surface text-fg hover:bg-surface-2",
  ghost: "border border-line-strong text-fg-muted hover:border-fg-subtle hover:text-fg",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-sm",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-md",
  icon: "size-10 rounded-md justify-center",
  "icon-sm": "size-8 rounded-sm justify-center",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Стоимость действия в кредитах — показывается прямо на кнопке */
  cost?: number;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", cost, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "press inline-flex shrink-0 select-none items-center font-medium whitespace-nowrap",
        "disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
      {cost !== undefined && (
        <span
          className={cn(
            "ml-0.5 rounded-xs px-1.5 py-0.5 text-[11px] leading-none font-medium tabular-nums",
            variant === "primary" ? "bg-primary-fg/10 text-primary-fg" : "bg-bg/60 text-fg-muted",
          )}
        >
          {cost === 0 ? "бесплатно" : `${cost} кр.`}
        </span>
      )}
    </button>
  );
});
