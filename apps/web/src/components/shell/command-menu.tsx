"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clapperboard, CreditCard, Film, Layers, Palette, Plus, Sparkles } from "lucide-react";
import { projects } from "@/lib/mock";
import { presetRegistry as presets } from "@/presets/registry";

// Открывается без анимации — частое клавиатурное действие (правило 3).
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const item =
    "flex h-10 cursor-pointer items-center gap-3 rounded-sm px-3 text-sm text-fg-muted data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";
  const group =
    "px-2 pb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-fg-subtle";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Поиск и команды"
      overlayClassName="fixed inset-0 z-50 bg-bg/70"
      contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-lg border border-line-strong bg-surface"
    >
      <Command.Input
        autoFocus
        placeholder="Найти проект, пресет или действие…"
        className="h-13 w-full border-b border-line bg-transparent px-4 text-[15px] outline-none placeholder:text-fg-subtle"
      />
      <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto pb-2">
        <Command.Empty className="px-4 py-8 text-center text-sm text-fg-subtle">Ничего не нашли</Command.Empty>
        <Command.Group heading="Действия" className={group}>
          <Command.Item className={item} onSelect={() => go("/")}>
            <Plus /> Новый шортс из видео
          </Command.Item>
          <Command.Item className={item} onSelect={() => go("/inserts")}>
            <Sparkles /> Новая вставка по описанию
          </Command.Item>
          <Command.Item className={item} onSelect={() => go("/billing")}>
            <CreditCard /> Пополнить кредиты
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Проекты" className={group}>
          {projects.map((p) => (
            <Command.Item key={p.id} value={`проект ${p.title}`} className={item} onSelect={() => go(`/projects/${p.id}`)}>
              <Film /> {p.title}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Пресеты" className={group}>
          {presets.slice(0, 8).map((p) => (
            <Command.Item key={p.id} value={`пресет ${p.name}`} className={item} onSelect={() => go(`/presets?c=${p.category}`)}>
              <Layers /> {p.name}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Разделы" className={group}>
          <Command.Item className={item} onSelect={() => go("/projects")}>
            <Clapperboard /> Проекты
          </Command.Item>
          <Command.Item className={item} onSelect={() => go("/brand")}>
            <Palette /> Бренд-кит
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
