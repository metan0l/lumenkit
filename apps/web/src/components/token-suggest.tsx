"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Clapperboard, ImageIcon, Layers } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { genModels } from "@lumenkit/core";
import { presetCategories, presetRegistry as presets } from "@/presets/registry";

/*
 * Подсказки при вводе «{»: модели и стили, фильтр по набранному.
 * Открыты, пока курсор стоит после незакрытой «{» и до двоеточия
 * («{nano-banana: …» — уже пишут промпт, подсказка не мешает).
 */

export type Suggestion =
  | { type: "model"; id: string; label: string; hint: string; cost: number; kind: "image" | "video"; snippet: string; back: number }
  | { type: "preset"; id: string; label: string; hint: string; snippet: string; back: number };

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");

/** Где начинается незакрытая «{» перед курсором и что после неё набрано */
export function suggestContext(value: string, caret: number) {
  const before = value.slice(0, caret);
  const start = before.lastIndexOf("{");
  if (start < 0) return null;
  const query = before.slice(start + 1);
  if (/[}:\n]/.test(query) || query.length > 30) return null;
  return { start, query };
}

export function suggestions(query: string): Suggestion[] {
  const q = norm(query);
  const hit = (...xs: string[]) => !q || xs.some((x) => norm(x).includes(q));
  const starts = (...xs: string[]) => !!q && xs.some((x) => norm(x).startsWith(q));

  const models: Suggestion[] = genModels
    .filter((m) => hit(m.id, m.label, m.kind === "image" ? "картинка фото" : "видео"))
    .map((m) => ({ type: "model", id: m.id, label: m.label, hint: m.strength, cost: m.cost, kind: m.kind, snippet: `{${m.id}: }`, back: 1 }));

  const cat = (id: string) => presetCategories.find((c) => c.id === id)?.label ?? "";
  const styles: Suggestion[] = presets
    .filter((p) => hit(p.name, cat(p.category)))
    .sort((a, b) => Number(starts(b.name)) - Number(starts(a.name)))
    .map((p) => ({ type: "preset", id: p.id, label: p.name, hint: cat(p.category), snippet: `{${p.name}} `, back: 0 }));

  // Без запроса — все модели и несколько стилей; с запросом — сначала то, что начинается с набранного
  return [...models, ...styles].slice(0, q ? 8 : 7);
}

const tone = { image: "bg-gen-image-soft text-gen-image", video: "bg-gen-video-soft text-gen-video" } as const;

export function SuggestList({
  items,
  active,
  onHover,
  onPick,
  style,
  above,
}: {
  items: Suggestion[];
  active: number;
  onHover: (i: number) => void;
  onPick: (s: Suggestion) => void;
  style: React.CSSProperties;
  above?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  // Активный пункт всегда в зоне видимости при листании стрелками
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const firstPreset = items.findIndex((s) => s.type === "preset");

  return (
    <motion.div
      ref={list}
      role="listbox"
      aria-label="Подсказки: модели и стили"
      initial={{ opacity: 0, y: above ? 4 : -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={springs.ui}
      style={style}
      className={cn(
        "panel-raised absolute z-40 max-h-[300px] w-[300px] overflow-y-auto rounded-lg p-1.5",
        above ? "origin-bottom-left" : "origin-top-left",
      )}
      // Клик по списку не должен уводить фокус из поля
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.map((s, i) => (
        <div key={`${s.type}:${s.id}`}>
          {(i === 0 && s.type === "model") || i === firstPreset ? (
            <div className="label-mono px-2.5 pt-1.5 pb-1">{s.type === "model" ? "Модели" : "Стили"}</div>
          ) : null}
          <button
            data-i={i}
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => onHover(i)}
            onClick={() => onPick(s)}
            className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left", i === active && "bg-surface-2")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-sm",
                s.type === "model" ? tone[s.kind] : "bg-accent-soft text-accent-hover",
              )}
            >
              {s.type === "model" ? (
                s.kind === "image" ? <ImageIcon className="size-3.5" /> : <Clapperboard className="size-3.5" />
              ) : (
                <Layers className="size-3.5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{s.label}</span>
              <span className="t-meta block truncate text-[12px]">{s.type === "model" ? s.id : s.hint}</span>
            </span>
            {s.type === "model" && <span className="t-num shrink-0 text-[11px] text-fg-subtle">{s.cost} кр.</span>}
          </button>
        </div>
      ))}
      <div className="t-meta flex gap-3 border-t border-line px-2.5 pt-1.5 pb-0.5 text-[11px]">
        <span>↑↓ выбрать</span>
        <span>Enter вставить</span>
        <span>Esc закрыть</span>
      </div>
    </motion.div>
  );
}
