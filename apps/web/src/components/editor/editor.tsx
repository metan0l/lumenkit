"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import {
  AudioLines,
  ChevronDown,
  CircleCheck,
  Coins,
  Copy,
  Film,
  Minus,
  Pause,
  Play,
  Plus,
  Redo2,
  Repeat,
  Scissors,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { credits } from "@/lib/mock";
import type { Project } from "@/lib/project";
import type { ProjectData } from "@/server/projects";
import { springs } from "@/lib/motion";
import { Logo } from "@/components/shell/logo";
import { LogoLoader } from "@/components/brand/animated-logo";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Chat, type QuickAction } from "./chat";
import { ExportDialog } from "./export-dialog";
import { Inspector } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { Player } from "./player";
import { EditorProvider, useEditor, useTime } from "./store";
import { Timeline } from "./timeline";
import { Transcript } from "./transcript";

function useIsDesktop() {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setV(mq.matches);
    const on = () => setV(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

/** Таймкод как в референсе: 00:00:06:02 (чч:мм:сс:кадры при 30 к/с) */
function tc(t: number) {
  const f = Math.floor((t % 1) * 30);
  const s = Math.floor(t) % 60;
  const m = Math.floor(t / 60) % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(m)}:${p(s)}:${p(f)}`;
}

type Tool = "ai" | "text" | "styles";

const tools: { id: Tool; label: string }[] = [
  { id: "ai", label: "Claude" },
  { id: "text", label: "Текст" },
  { id: "styles", label: "Стили" },
];

const quickActions: QuickAction[] = [
  { title: "Убрать паузы", sub: "Вырезать «эээ» и тишину", prompt: "Убери все паузы и слова-паразиты", icon: <Scissors className="size-5" /> },
  { title: "Добавить хук", sub: "Цепляющий вопрос в первые 2 секунды", prompt: "Добавь хук в первые 2 секунды", icon: <Type className="size-5" /> },
  { title: "Заменить переходы", sub: "Одним стилем по всему ролику", prompt: "Замени переходы на шторку", icon: <Repeat className="size-5" /> },
  { title: "Музыка под голос", sub: "Тише и с приглушением под речь", prompt: "Сделай музыку тише под голос", icon: <AudioLines className="size-5" /> },
];

export function Editor({ data }: { data: ProjectData }) {
  return (
    <EditorProvider data={data}>
      <EditorLayout project={data.project} />
    </EditorProvider>
  );
}

function EditorLayout({ project }: { project: Project }) {
  const desktop = useIsDesktop();
  const ed = useEditor();
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) ed.redo();
        else ed.undo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [ed]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <TopBar project={project} onExport={() => setExportOpen(true)} />
      {desktop === null ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <LogoLoader label="Готовим редактор" />
        </div>
      ) : desktop ? (
        <DesktopLayout project={project} />
      ) : (
        <MobileLayout project={project} />
      )}
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}

function TopBar({ project, onExport }: { project: Project; onExport: () => void }) {
  const [title, setTitle] = useState(project.title);
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-3 md:px-4">
      <Link href="/projects" className="panel press flex h-11 items-center gap-1.5 rounded-md px-2.5 hover:bg-surface-2" aria-label="К проектам">
        <Logo />
        <ChevronDown className="size-4 text-fg-subtle" />
      </Link>
      <Link href="/billing" className="panel press hidden h-11 items-center gap-3 rounded-md pr-1.5 pl-3.5 hover:bg-surface-2 sm:flex">
        <Coins className="size-4 text-accent-hover" />
        <span className="font-mono text-[14px] tabular-nums">{credits.balance}</span>
        <span className="rounded-sm bg-accent-soft px-2.5 py-1.5 text-[13px] font-medium text-accent-hover">Пополнить</span>
      </Link>

      <label className="min-w-0 flex-1 text-center">
        <span className="sr-only">Название проекта</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mx-auto w-full max-w-[420px] truncate rounded-sm bg-transparent px-2 py-1 text-center text-[15px] font-medium outline-none hover:bg-surface focus:bg-surface"
        />
      </label>

      <ThemeToggle className="size-11 rounded-md" />
      <button onClick={onExport} className="press flex h-11 items-center gap-2 rounded-md bg-accent-soft px-4 text-[14px] font-medium text-accent-hover hover:bg-accent/25">
        <CircleCheck className="size-[18px]" />
        <span className="hidden sm:inline">Экспорт</span>
      </button>
    </header>
  );
}

function DesktopLayout({ project }: { project: Project }) {
  const ed = useEditor();
  const [tool, setTool] = useState<Tool>("ai");
  const [pps, setPps] = useState(44);

  return (
    <>
      <div className="flex min-h-0 flex-1 gap-4 px-4">
        {/* Одна панель слева: чат по умолчанию, текст и стили — вкладками */}
        <aside className="panel-raised mb-4 flex w-[380px] shrink-0 flex-col overflow-hidden rounded-lg">
          <div className="shrink-0 p-3">
            <ToolTabs value={tool} onChange={setTool} id="d-tab" />
          </div>
          <div className="min-h-0 flex-1">
            {tool === "ai" && <Chat quickActions={quickActions} />}
            {tool === "text" && <Transcript />}
            {tool === "styles" && <LibraryPanel initial="captions" />}
          </div>
        </aside>

        {/* Сцена */}
        <main className="flex min-w-0 flex-1 items-center justify-center pb-4">
          <div className="h-full w-full">
            <Player src={project.src} poster={project.poster} hideTransport />
          </div>
        </main>

        {/* Настройки блока — только когда блок выбран */}
        {ed.selectedId !== null && (
          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.ui}
            className="panel-raised mb-4 w-[320px] shrink-0 overflow-hidden rounded-lg"
          >
            <Inspector onClose={() => ed.select(null)} />
          </motion.aside>
        )}
      </div>

      <Toolbar pps={pps} setPps={setPps} />
      <div className="h-[284px] shrink-0">
        <Timeline pps={pps} filmstrip={project.filmstrip} wave={project.wave} />
      </div>
    </>
  );
}

function ToolTabs<T extends string>({ value, onChange, id, withTimeline }: { value: T; onChange: (t: T) => void; id: string; withTimeline?: boolean }) {
  const ed = useEditor();
  const list = (withTimeline ? [...tools.slice(0, 1), { id: "timeline", label: "Таймлайн" }, ...tools.slice(1)] : tools) as { id: T; label: string }[];
  return (
    <div className="flex rounded-md bg-surface p-1" role="tablist">
      {list.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn("relative h-9 flex-1 rounded-sm text-[14px] font-medium", value === t.id ? "text-fg" : "text-fg-subtle hover:text-fg-muted")}
        >
          {value === t.id && <motion.span layoutId={id} transition={springs.layout} className="absolute inset-0 rounded-sm bg-surface-3" />}
          <span className="relative">
            {t.label}
            {t.id === "styles" && ed.attached.length > 0 && <span className="ml-1 text-accent-hover">· {ed.attached.length}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/* Нижняя панель инструментов, как в референсе */
function Toolbar({ pps, setPps }: { pps: number; setPps: (v: number) => void }) {
  const ed = useEditor();
  const t = useTime();
  const toast = useToast();
  const sel = ed.blocks.find((b) => b.id === ed.selectedId);

  const split = () => {
    const v = ed.blocks.find((b) => b.track === "video" && t > b.start + 0.2 && t < b.end - 0.2);
    if (!v) return toast({ text: "Поставьте плейхед внутрь клипа видео" });
    ed.commit((s) => ({
      ...s,
      blocks: s.blocks.flatMap((b) =>
        b.id === v.id ? [{ ...b, end: t }, { ...b, id: `${b.id}-${Date.now()}`, start: t, label: `${b.label} · 2` }] : [b],
      ),
    }));
    toast({ text: "Клип разрезан", action: { label: "Отменить", onClick: ed.undo } });
  };

  const duplicate = () => {
    if (!sel || sel.track === "video") return toast({ text: "Выберите блок пресета на таймлайне" });
    const len = sel.end - sel.start;
    ed.commit((s) => ({ ...s, blocks: [...s.blocks, { ...sel, id: `${sel.id}-c${Date.now()}`, start: sel.end, end: Math.min(ed.duration, sel.end + len) }] }));
  };

  const remove = () => {
    if (!sel) return toast({ text: "Выберите блок на таймлайне" });
    ed.commit((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== sel.id) }));
    ed.select(null);
    toast({ text: "Блок удалён", action: { label: "Отменить", onClick: ed.undo } });
  };

  const removeFillers = () => {
    const fill = ed.words.filter((w) => w.filler && !ed.deleted.has(w.id));
    ed.commit((s) => ({ ...s, deleted: [...s.deleted, ...fill.map((f) => f.id)] }));
    toast({ text: fill.length ? `Убрано пауз и паразитов: ${fill.length}` : "Паразитов не нашлось", action: fill.length ? { label: "Отменить", onClick: ed.undo } : undefined });
  };

  const iconBtn = "press grid size-11 place-items-center rounded-md text-fg-muted hover:bg-surface hover:text-fg";

  return (
    <div className="flex h-16 shrink-0 items-center gap-2 px-6">
      <div className="panel flex h-12 items-center rounded-md px-1">
        <button className={cn(iconBtn, "size-10")} onClick={ed.undo} disabled={!ed.canUndo} aria-label="Отменить (Ctrl+Z)" title="Отменить (Ctrl+Z)">
          <Undo2 className="size-[19px]" />
        </button>
        <span className="h-5 w-px bg-line-strong" />
        <button className={cn(iconBtn, "size-10")} onClick={ed.redo} disabled={!ed.canRedo} aria-label="Повторить (Ctrl+Shift+Z)" title="Повторить">
          <Redo2 className="size-[19px]" />
        </button>
      </div>
      <button className={iconBtn} onClick={split} aria-label="Разрезать по плейхеду" title="Разрезать по плейхеду">
        <Scissors className="size-[19px]" />
      </button>
      <button className={iconBtn} onClick={duplicate} aria-label="Дублировать блок" title="Дублировать блок">
        <Copy className="size-[19px]" />
      </button>
      <button className={iconBtn} onClick={remove} aria-label="Удалить блок" title="Удалить блок">
        <Trash2 className="size-[19px]" />
      </button>
      <span className="mx-1 h-6 w-px bg-line-strong" />
      <button className={iconBtn} onClick={removeFillers} aria-label="Убрать паузы и паразиты" title="Убрать паузы и паразиты">
        <AudioLines className="size-[19px]" />
      </button>
      <button className={iconBtn} onClick={() => toast({ text: "Сцены отмечены по смене плана" })} aria-label="Найти сцены" title="Найти сцены">
        <Film className="size-[19px]" />
      </button>

      <div className="mx-auto flex items-center gap-4">
        <span className="w-[112px] text-right font-mono text-[15px] text-fg-subtle tabular-nums">{tc(t)}</span>
        <button
          onClick={() => ed.setPlaying(!ed.playing)}
          className="panel press grid size-12 place-items-center rounded-md hover:bg-surface-2"
          aria-label={ed.playing ? "Пауза" : "Воспроизвести"}
        >
          {ed.playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
        </button>
        <span className="w-[112px] font-mono text-[15px] tabular-nums">{tc(ed.duration)}</span>
      </div>

      <div className="panel flex h-12 items-center gap-2 rounded-md px-3">
        <button className="press grid size-7 place-items-center text-fg-muted hover:text-fg" onClick={() => setPps(Math.max(16, pps - 8))} aria-label="Уменьшить масштаб">
          <Minus className="size-4" />
        </button>
        <input type="range" min={16} max={120} value={pps} onChange={(e) => setPps(+e.target.value)} className="w-32 accent-[var(--fg)]" aria-label="Масштаб таймлайна" />
        <button className="press grid size-7 place-items-center text-fg-muted hover:text-fg" onClick={() => setPps(Math.min(120, pps + 8))} aria-label="Увеличить масштаб">
          <Plus className="size-4" />
        </button>
        <button className="press ml-1 text-[14px] text-fg-muted hover:text-fg" onClick={() => setPps(28)}>
          Fit
        </button>
      </div>
    </div>
  );
}

function MobileLayout({ project }: { project: Project }) {
  const ed = useEditor();
  const [tab, setTab] = useState<Tool | "timeline">("ai");
  const open = ed.selectedId !== null;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-[40dvh] shrink-0 px-4 pt-1">
        <Player src={project.src} poster={project.poster} />
      </div>
      <div className="mx-4 mt-3">
        <ToolTabs value={tab} onChange={setTab} id="m-tab" withTimeline />
      </div>
      <div className="min-h-0 flex-1 pt-2">
        {tab === "ai" ? (
          <Chat />
        ) : tab === "timeline" ? (
          <Timeline pps={30} filmstrip={project.filmstrip} wave={project.wave} />
        ) : tab === "text" ? (
          <Transcript />
        ) : (
          <LibraryPanel />
        )}
      </div>

      <Drawer.Root open={open} onOpenChange={(v) => !v && ed.select(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-bg/60" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col rounded-t-xl bg-surface pb-[env(safe-area-inset-bottom)] outline-none">
            <Drawer.Handle className="mt-2 !w-10 !bg-surface-3" />
            <Drawer.Title className="sr-only">Настройки блока</Drawer.Title>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Inspector onClose={() => ed.select(null)} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
