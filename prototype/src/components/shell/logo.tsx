import { cn } from "@/lib/cn";

/*
 * Lumen Kit. Знак — набор из четырёх модулей (kit), один из которых — свет (lumen):
 * три плитки и четырёхлучевая искра. Модули = разделы платформы (студия, агенты, аналитика…).
 */
const SPARK = "M23 2.2c.6 4.2 2.6 6.2 6.8 6.8-4.2.6-6.2 2.6-6.8 6.8-.6-4.2-2.6-6.2-6.8-6.8 4.2-.6 6.2-2.6 6.8-6.8z";

export function Logo({ className, tile = false }: { className?: string; tile?: boolean }) {
  const fg = tile ? "var(--bg)" : "var(--fg)";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      {tile && <rect width="32" height="32" rx="9" fill="var(--fg)" />}
      <g transform={tile ? "translate(4 4) scale(0.75)" : undefined}>
        <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3.6" fill={fg} />
        <rect x="2.2" y="18.2" width="11.6" height="11.6" rx="3.6" fill={fg} />
        <rect x="18.2" y="18.2" width="11.6" height="11.6" rx="3.6" fill={fg} />
        <path d={SPARK} fill="var(--accent)" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo className="size-7" />
      <span className="text-[18px] font-semibold tracking-[-0.035em]">
        lumen<span className="text-fg-muted">kit</span>
      </span>
    </span>
  );
}
