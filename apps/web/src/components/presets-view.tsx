"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { presetCategories, presetRegistry as presets } from "@/presets/registry";
import { dimensionLabel, type PresetDef as Preset, type PresetCategory } from "@/presets/types";
import { enter, enterItem, springs } from "@/lib/motion";
import { PageHeader } from "@/components/shell/app-shell";
import { PresetMedia } from "@/components/preset-media";
import { SchemaForm } from "@/components/schema-form";
import { defaultParams } from "@/presets/registry";
import { LibraryCard } from "@/components/preset-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PresetsView() {
  const [cat, setCat] = useState<PresetCategory>("captions");
  const [selected, setSelected] = useState<Preset | null>(null);

  // Категория живёт в URL (?c=), без useSearchParams — чтобы страница оставалась статической.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c") as PresetCategory | null;
    if (c && presetCategories.some((x) => x.id === c)) setCat(c);
  }, []);
  const choose = (c: PresetCategory) => {
    setCat(c);
    history.replaceState(null, "", `?c=${c}`);
  };

  const list = presets.filter((p) => p.category === cat);
  // Первый вход ждёт заголовок и вкладки; смена категории — без задержки
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Библиотека"
        description="Пресеты — это примеры для Claude. Перетащите карточку в промпт на главной или в чат редактора, либо откройте, чтобы настроить."
      />
      <motion.div {...enter(1)} className="sticky top-14 z-20 bg-bg px-4 py-2 md:top-0 md:px-8">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist">
          {presetCategories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => choose(c.id)}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-1.5 rounded-xs px-3.5 text-[14px] font-medium transition-colors",
                cat === c.id ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {cat === c.id && (
                <motion.span layoutId="preset-cat" transition={springs.layout} className="absolute inset-0 rounded-xs bg-surface-2" />
              )}
              <span className="relative">{c.label}</span>
              <span className="relative text-[12px] text-fg-subtle tabular-nums">
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* key={cat}: при смене категории карточки заново входят коротким каскадом */}
      <div key={cat} className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 pt-4 pb-10 sm:grid-cols-3 md:px-8 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p, i) => (
          <motion.div key={p.id} {...enterItem(i, first.current ? 2 : 0)}>
            <LibraryCard preset={p} onOpen={() => setSelected(p)} />
          </motion.div>
        ))}
      </div>

      <PresetDetail preset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PresetDetail({ preset, onClose }: { preset: Preset | null; onClose: () => void }) {
  const [params, setParams] = useState<Record<string, unknown>>({});
  useEffect(() => {
    if (preset) setParams(defaultParams(preset));
  }, [preset]);
  useEffect(() => {
    if (!preset) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preset, onClose]);

  return (
    <AnimatePresence>
      {preset && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-bg/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={preset.name}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={springs.ui}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-5 overflow-y-auto rounded-t-xl bg-surface p-5 md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[86dvh] md:w-[820px] md:-translate-x-1/2 md:-translate-y-1/2 md:flex-row md:rounded-xl md:p-6"
          >
            <PresetMedia presetId={preset.id} params={params} playing className="mx-auto aspect-[9/16] w-[220px] shrink-0 self-start rounded-lg md:w-[300px]" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-medium tracking-[-0.015em]">{preset.name}</h2>
                {preset.dimension && preset.dimension !== "2d" && <Badge>{dimensionLabel[preset.dimension]}</Badge>}
                {preset.tier === "pro" && <Badge tone="pro">PRO</Badge>}
              </div>
              <p className="mt-1 text-[14px] text-fg-muted">{preset.description}</p>
              {preset.useWhen && <p className="mt-1 text-[13px] text-fg-subtle">Когда ставить: {preset.useWhen}</p>}
              <div className="mt-5 min-h-0 flex-1">
                <SchemaForm schema={preset.schema} value={params} onChange={(k, v) => setParams((p) => ({ ...p, [k]: v }))} />
              </div>
              <div className="flex flex-wrap gap-2 pt-6">
                <Button variant="primary" size="lg" cost={0} onClick={onClose}>
                  <Check /> Применить к проекту
                </Button>
                <Button size="lg" onClick={() => setParams(defaultParams(preset))}>
                  Сбросить
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
