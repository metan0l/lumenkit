import { cn } from "@/lib/cn";

const SPARK = "M23 2.2c.6 4.2 2.6 6.2 6.8 6.8-4.2.6-6.2 2.6-6.8 6.8-.6-4.2-2.6-6.2-6.8-6.8 4.2-.6 6.2-2.6 6.8-6.8z";

/*
 * Анимированный знак Lumen Kit на CSS: плитки «собираются» по очереди (шаг 0.08 с),
 * затем загорается и дышит искра. Работает до гидрации React — подходит для прелоадера
 * и любых состояний загрузки.
 */
export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-16 overflow-visible", className)} aria-hidden>
      <circle className="lk-halo" cx="23" cy="9" r="7.5" fill="var(--accent)" opacity="0.4" />
      <rect className="lk-tile" style={{ animationDelay: "0s" }} x="2.2" y="2.2" width="11.6" height="11.6" rx="3.6" fill="var(--fg)" />
      <rect className="lk-tile" style={{ animationDelay: "0.08s" }} x="2.2" y="18.2" width="11.6" height="11.6" rx="3.6" fill="var(--fg)" />
      <rect className="lk-tile" style={{ animationDelay: "0.16s" }} x="18.2" y="18.2" width="11.6" height="11.6" rx="3.6" fill="var(--fg)" />
      <path className="lk-spark" d={SPARK} fill="var(--accent)" />
    </svg>
  );
}

/** Компактный загрузчик: знак + бегущая полоска (для экранов и Suspense) */
export function LogoLoader({ label = "Загрузка", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-label={label} className={cn("flex flex-col items-center gap-6", className)}>
      <AnimatedLogo className="size-12" />
      <span className="relative block h-[3px] w-24 overflow-hidden rounded-full bg-surface-3">
        <span className="lk-bar absolute inset-y-0 left-0 w-full rounded-full bg-accent" />
      </span>
    </div>
  );
}
