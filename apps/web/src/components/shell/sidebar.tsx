"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { navItems } from "./nav-items";
import { Logo } from "./logo";

/* Узкая колонка иконок (как в референсах): «+» сверху, разделы, профиль снизу. Подписи — во всплывашках. */
export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col items-center gap-2 py-4 md:flex">
      <Link href="/" className="mb-3 grid size-10 place-items-center" aria-label="Lumen Kit — на главную">
        <Logo className="size-8" />
      </Link>

      <Link
        href="/"
        className="press mb-4 grid size-11 place-items-center rounded-md bg-primary text-primary-fg hover:bg-primary-hover"
        aria-label="Создать"
        title="Создать"
      >
        <Plus className="size-5" strokeWidth={2.2} />
      </Link>

      <nav className="flex flex-col items-center gap-1.5" aria-label="Основное меню">
        {navItems
          .filter((i) => i.href !== "/")
          .map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative grid size-11 place-items-center rounded-md transition-colors duration-150",
                  active ? "text-fg" : "text-fg-subtle hover:text-fg",
                )}
              >
                {active && <motion.span layoutId="rail-active" transition={springs.layout} className="absolute inset-0 rounded-md bg-surface-3" />}
                <Icon className="relative size-[20px]" strokeWidth={1.8} />
                <span className="pointer-events-none absolute left-[calc(100%+10px)] z-10 rounded-sm bg-surface-3 px-2.5 py-1.5 text-[12px] whitespace-nowrap text-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        <button
          onClick={onSearch}
          title="Поиск и команды (Ctrl K)"
          aria-label="Поиск и команды"
          className="press grid size-11 place-items-center rounded-md text-fg-subtle hover:text-fg"
        >
          <Search className="size-[20px]" strokeWidth={1.8} />
        </button>
        <Link
          href="/billing"
          title="Профиль и бренд-кит"
          aria-label="Профиль и бренд-кит"
          className={cn(
            "grid size-11 place-items-center rounded-md transition-colors",
            pathname.startsWith("/billing") || pathname.startsWith("/brand") ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg",
          )}
        >
          <UserRound className="size-[20px]" strokeWidth={1.8} />
        </Link>
      </div>
    </aside>
  );
}
