"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Plus, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { projects } from "@/lib/mock";
import { enter, enterItem, springs } from "@/lib/motion";
import { PageHeader } from "@/components/shell/app-shell";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/ui/states";

const filters = [
  { id: "all", label: "Все" },
  { id: "short", label: "Шортсы" },
  { id: "insert", label: "Вставки" },
  { id: "draft", label: "Черновики" },
] as const;

export function ProjectsView() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);

  const list = projects.filter((p) => {
    if (filter === "short" && p.kind !== "short") return false;
    if (filter === "insert" && p.kind !== "insert") return false;
    if (filter === "draft" && p.status !== "draft") return false;
    return p.title.toLowerCase().includes(dq.trim().toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Проекты"
        actions={
          <Link
            href="/"
            className="press inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            <Plus className="size-4" /> Новый шортс
          </Link>
        }
      />
      <motion.div {...enter(1)} className="flex flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "relative h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium transition-colors",
                filter === f.id ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {filter === f.id && (
                <motion.span layoutId="proj-filter" transition={springs.layout} className="absolute inset-0 rounded-full bg-surface-2" />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>
        <label className="flex h-10 items-center gap-2 rounded-md bg-surface px-3 sm:w-72">
          <Search className="size-4 text-fg-subtle" />
          <span className="sr-only">Поиск по проектам</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
          />
        </label>
      </motion.div>

      {list.length === 0 ? (
        <EmptyState
          className="mx-4 md:mx-10"
          icon={SearchX}
          title={`Ничего не нашли по «${q}»`}
          text="Проверьте название или начните новый проект — Claude смонтирует его за минуту."
          action={
            <Link href="/" className="press inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[14px] font-medium text-primary-fg hover:bg-primary-hover">
              <Plus className="size-4" /> Новый шортс
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 px-4 pb-10 sm:grid-cols-3 md:px-8 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p, i) => (
            <motion.div key={p.id} {...enterItem(i)}>
              <ProjectCard project={p} priority={i < 4} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
