"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { credits } from "@/lib/mock";
import { enter } from "@/lib/motion";
import { CommandMenu } from "./command-menu";
import { MobileHeader, MobileNav } from "./mobile-nav";
import { Ring, useMockProgress } from "./queue-indicator";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <Sidebar onSearch={() => setCmdOpen(true)} />
      <MobileHeader />
      <div className="pb-28 md:pb-0 md:pl-[var(--sidebar-w)]">
        <TopBar />
        {children}
      </div>
      <MobileNav />
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}

/* Правый верх, как во втором референсе: очередь, расход кредитов, аватар */
function TopBar() {
  const p = useMockProgress(64);
  return (
    <div className="hidden h-16 items-center justify-end gap-2 px-6 md:flex">
      <Link
        href="/projects/bmw-v-tumane"
        className="press flex h-9 items-center gap-2 rounded-sm px-3 text-[13px] text-fg-muted hover:bg-surface hover:text-fg"
        title="Рендер в очереди"
      >
        <Ring value={p} size={18} />
        <span className="font-mono tabular-nums">{p}%</span>
      </Link>
      <Link href="/billing" className="panel press flex h-9 items-center gap-2.5 rounded-sm px-3 text-[13px] hover:bg-surface-2">
        <span className="text-fg-subtle">Кредиты</span>
        <span className="font-mono tabular-nums">
          {credits.balance}
          <span className="text-fg-subtle"> / {credits.monthly}</span>
        </span>
        <span className="font-medium text-accent-hover">Пополнить</span>
      </Link>
      <ThemeToggle />
      <Link
        href="/billing"
        aria-label="Профиль"
        className="grid size-9 place-items-center rounded-full bg-accent-soft text-[13px] font-medium text-accent-hover ring-1 ring-accent/40"
      >
        ДК
      </Link>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div {...enter(0)} className="flex flex-col gap-4 px-4 pt-6 pb-6 sm:flex-row sm:items-end sm:justify-between md:px-10 md:pt-2">
      <div>
        <h1 className="t-title">{title}</h1>
        {description && <p className="t-body mt-2 max-w-[60ch]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
