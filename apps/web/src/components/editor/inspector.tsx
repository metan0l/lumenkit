"use client";

import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { trackLabel, type Track } from "@/lib/mock";
import { presetRegistry as presets } from "@/presets/registry";
import type { PresetDef as Preset } from "@/presets/types";
import { usePreviewPlay } from "@/lib/use-preview-play";
import { getPreset, resolveParams } from "@/presets/registry";
import type { PresetCategory } from "@/presets/types";
import { PresetMedia } from "@/components/preset-media";
import { SchemaForm } from "@/components/schema-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useEditor } from "./store";

const trackCategories: Partial<Record<Track, PresetCategory[]>> = {
  captions: ["captions"],
  plates: ["plates", "hooks"],
  zooms: ["zooms"],
  transitions: ["transitions"],
};

export function Inspector({ onClose }: { onClose?: () => void }) {
  const ed = useEditor();
  const toast = useToast();
  const block = ed.blocks.find((b) => b.id === ed.selectedId);

  if (!block) {
    return (
      <div className="flex h-full flex-col gap-5 p-4">
        <div>
          <h3 className="text-[15px] font-medium">Проект</h3>
          <p className="mt-1 text-[13px] text-fg-muted">Выберите блок на таймлайне, чтобы настроить его или заменить пресет.</p>
        </div>
        <dl className="text-[13px]">
          {[
            ["Формат", "9:16 · 1080×1920"],
            ["Частота", "30 к/с"],
            ["Бренд-кит", "Даня Кот"],
            ["Язык субтитров", "Русский"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line py-2.5">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  const preset = getPreset(block.presetId);
  const cats = trackCategories[block.track] ?? [];
  const alternatives = presets.filter((p) => cats.includes(p.category));

  const swap = (p: Preset) => {
    const prev = block.label;
    ed.commit((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === block.id ? { ...b, presetId: p.id, label: p.name, params: undefined } : b)),
    }));
    toast({ text: `«${prev}» → «${p.name}»`, action: { label: "Отменить", onClick: ed.undo } });
  };

  const setParam = (key: string, v: unknown) =>
    ed.patch((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === block.id ? { ...b, params: { ...b.params, [key]: v } } : b)),
    }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <div className="text-[12px] text-fg-subtle">{trackLabel[block.track]}</div>
          <h3 className="truncate text-[16px] font-medium">{block.label}</h3>
        </div>
        <button
          onClick={() => {
            ed.select(null);
            onClose?.();
          }}
          className="press grid size-8 place-items-center rounded-sm text-fg-subtle hover:bg-surface-2 hover:text-fg"
          aria-label="Закрыть настройки блока"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {preset ? (
          <SchemaForm schema={preset.schema} value={resolveParams(preset, block.params)} onChange={setParam} />
        ) : (
          <p className="text-[13px] text-fg-muted">У этого блока нет настраиваемых параметров.</p>
        )}

        {alternatives.length > 0 && (
          <section className="mt-6">
            <h4 className="mb-2 text-[13px] font-medium">Заменить на</h4>
            <div className="grid grid-cols-3 gap-2">
              {alternatives.map((p) => (
                <SwapTile key={p.id} preset={p} active={p.id === preset?.id} onPick={() => swap(p)} />
              ))}
            </div>
          </section>
        )}

        <Button
          variant="danger"
          size="sm"
          className="mt-6"
          onClick={() => {
            ed.commit((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== block.id) }));
            ed.select(null);
            onClose?.();
            toast({ text: "Блок удалён", action: { label: "Отменить", onClick: ed.undo } });
          }}
        >
          <Trash2 /> Удалить блок
        </Button>
      </div>
    </div>
  );
}

function SwapTile({ preset, active, onPick }: { preset: Preset; active: boolean; onPick: () => void }) {
  const { ref, playing, bind } = usePreviewPlay<HTMLButtonElement>();
  return (
    <button ref={ref} {...bind} onClick={onPick} className="text-left" aria-pressed={active}>
      <PresetMedia
        presetId={preset.id}
        playing={playing}
        className={cn("aspect-[9/16] rounded-sm", active && "ring-2 ring-accent ring-offset-2 ring-offset-bg")}
      />
      <div className="mt-1 flex items-center gap-1">
        <span className="truncate text-[11px] font-medium">{preset.name}</span>
        {preset.tier === "pro" && <Badge tone="pro" className="h-4 px-1 text-[9px]">PRO</Badge>}
      </div>
    </button>
  );
}
