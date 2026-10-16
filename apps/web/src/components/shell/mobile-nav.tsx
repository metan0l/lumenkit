"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Layers, Plus, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { CreditsPill } from "./credits";
import { Wordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Ring, useMockProgress } from "./queue-indicator";

const items = [
  { href: "/projects", label: "Проекты", icon: Clapperboard },
  { href: "/presets", label: "Библиотека", icon: Layers },
  { href: "/", label: "Создать", icon: Plus, primary: true },
  { href: "/inserts", label: "Вставки", icon: Sparkles },
  { href: "/billing", label: "Профиль", icon: UserRound },
];

export function MobileHeader() {
  const p = useMockProgress(64);
  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2" aria-label="Lumen Kit — на главную">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/projects/bmw-v-tumane"
          className="press flex h-8 items-center gap-1.5 rounded-xs bg-surface-2 pr-3 pl-1.5 text-[12px] font-medium tabular-nums"
          aria-label={`Рендер ${p}%`}
        >
          <Ring value={p} size={20} />
          {p}%
        </Link>
        <CreditsPill />
        <ThemeToggle className="size-9" />
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Основное меню"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 md:hidden"
    >
      <ul className="glass flex h-16 items-center justify-around rounded-md border border-line px-1">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          const Icon = it.icon;
          if (it.primary) {
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-label={it.label}
                  className="press grid size-12 place-items-center rounded-xs bg-primary text-primary-fg"
                >
                  <Icon className="size-6" strokeWidth={2.2} />
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-12 w-[68px] flex-col items-center justify-center gap-0.5 rounded-xs text-[11px]",
                  active ? "text-fg" : "text-fg-subtle",
                )}
              >
                {active && (
                  <motion.span layoutId="mobile-active" transition={springs.layout} className="absolute inset-0 rounded-xs bg-surface-3/70" />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.1 : 1.8} />
                <span className="relative">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
