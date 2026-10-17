"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { presetCategories, presetRegistry as presets } from "@/presets/registry";
import { dimensionLabel, type PresetDef as Preset, type PresetCategory } from "@/presets/types";
import { springs } from "@/lib/motion";
import { usePreviewPlay } from "@/lib/use-preview-play";
import { presetDragProps } from "@/components/composer";
import { PresetMedia } from "@/components/preset-media";
import { PresetPreview } from "@/components/preset-preview";
import { Badge } from "@/components/ui/badge";

export function CategoryTabs({
  value,
  onChange,
  id,
  size = "md",
}: {
  value: PresetCategory;
  onChange: (c: PresetCategory) => void;
  id: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist">
      {presetCategories.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={value === c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "relative shrink-0 rounded-full font-medium transition-colors",
            size === "md" ? "h-9 px-3.5 text-[14px]" : "h-7 px-2.5 text-[12px]",
            value === c.id ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
          )}
        >
          {value === c.id && (
            <motion.span layoutId={`cat-${id}`} transition={springs.layout} className="absolute inset-0 rounded-full bg-surface-2" />
          )}
          <span className="relative">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Карточка пресета: перетащить в промпт, «+» — добавить, клик — открыть
 * (onOpen, если задан, иначе крупный предпросмотр с управлением).
 */
export function LibraryCard({
  preset,
  added,
  onAdd,
  onOpen,
  compact,
}: {
  preset: Preset;
  added?: boolean;
  onAdd?: () => void;
  onOpen?: () => void;
  compact?: boolean;
}) {
  const { ref, playing, bind } = usePreviewPlay<HTMLDivElement>();
  const [preview, setPreview] = useState(false);
  return (
    <div ref={ref} {...bind} className="lift group relative" {...presetDragProps(preset.id)}>
      <button
        onClick={onOpen ?? (() => setPreview(true))}
        className="block w-full cursor-grab rounded-md text-left outline-offset-4 active:cursor-grabbing"
        aria-label={onOpen ? `Открыть пресет «${preset.name}»` : `Посмотреть «${preset.name}»`}
      >
        <PresetMedia
          presetId={preset.id}
          playing={playing}
          // pointer-events-none: обложка сменяется живым Player при наведении — клик не должен теряться на подмене
          className={cn("pointer-events-none aspect-[9/16] rounded-md", added && "shadow-[0_0_0_2px_var(--accent)]")}
        />
      </button>
      {onAdd && (
        <button
          onClick={onAdd}
          aria-pressed={added}
          aria-label={added ? `«${preset.name}» уже в промпте` : `Добавить «${preset.name}» в промпт`}
          className={cn(
            "press absolute top-2 right-2 grid size-8 place-items-center rounded-full transition-opacity",
            added ? "bg-accent text-accent-fg opacity-100" : "bg-bg/70 text-fg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          {added ? <Check className="size-4" strokeWidth={2.6} /> : <Plus className="size-4" strokeWidth={2.4} />}
        </button>
      )}
      <div className={cn("flex items-center gap-1.5 px-0.5", compact ? "mt-1.5" : "mt-2.5")}>
        <span className={cn("truncate font-medium", compact ? "text-[12px]" : "text-[14px]")}>{preset.name}</span>
        {preset.isNew && !compact && <Badge tone="accent">Новый</Badge>}
        {preset.dimension && preset.dimension !== "2d" && (
          <Badge className={compact ? "h-4 px-1 text-[9px]" : undefined}>{dimensionLabel[preset.dimension]}</Badge>
        )}
        {preset.tier === "pro" && <Badge tone="pro" className={compact ? "h-4 px-1 text-[9px]" : undefined}>PRO</Badge>}
      </div>
      {!onOpen && <PresetPreview preset={preview ? preset : null} added={added} onAdd={onAdd} onClose={() => setPreview(false)} />}
    </div>
  );
}

/** Горизонтальная лента библиотеки для главной. */
export function LibraryStrip({ attached, onAdd }: { attached: string[]; onAdd: (id: string) => void }) {
  const [cat, setCat] = useState<PresetCategory>("captions");
  const list = presets.filter((p) => p.category === cat);
  return (
    <div>
      <CategoryTabs value={cat} onChange={setCat} id="strip" />
      <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        {list.map((p) => (
          <div key={p.id} className="w-[148px] shrink-0 snap-start sm:w-[176px]">
            <LibraryCard preset={p} added={attached.includes(p.id)} onAdd={() => onAdd(p.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
