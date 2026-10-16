import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "pro";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  accent: "bg-accent-soft text-accent-hover",
  success: "bg-success/14 text-success",
  warning: "bg-warning/14 text-warning",
  danger: "bg-danger/14 text-danger",
  pro: "bg-fg text-bg",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-xs px-1.5 text-[11px] leading-none font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-strong px-1 text-[11px] font-medium text-fg-subtle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
