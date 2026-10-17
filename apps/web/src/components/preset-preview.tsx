"use client";

import { Player } from "@remotion/player";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Plus, X } from "lucide-react";
import { springs } from "@/lib/motion";
import { PresetPreviewComp } from "@/presets/compositions";
import { FPS, HEIGHT, WIDTH, presetCategories } from "@/presets/registry";
import { dimensionLabel, type PresetDef as Preset } from "@/presets/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/*
 * Просмотр стиля крупно: та же композиция, что в карточке, но с управлением —
 * пауза, перемотка, по кругу. Открывается кликом по карточке на главной и в редакторе,
 * «+» на карточке по-прежнему сразу добавляет стиль в промпт.
 * Через портал: карточка с transform и draggable сломала бы fixed и перетаскивание.
 */
export function PresetPreview({
  preset,
  added,
  onAdd,
  onClose,
}: {
  preset: Preset | null;
  added?: boolean;
  onAdd?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!preset) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preset, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
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
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-xl bg-surface p-5 md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[90dvh] md:w-[400px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-[18px] font-medium tracking-[-0.01em]">{preset.name}</h2>
                  {preset.dimension && preset.dimension !== "2d" && <Badge>{dimensionLabel[preset.dimension]}</Badge>}
                  {preset.tier === "pro" && <Badge tone="pro">PRO</Badge>}
                </div>
                <p className="t-meta mt-0.5 text-fg-subtle">{presetCategories.find((c) => c.id === preset.category)?.label}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="press grid size-8 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mx-auto aspect-[9/16] w-full max-w-[300px] shrink-0 overflow-hidden rounded-lg bg-surface-2">
              <Player
                component={PresetPreviewComp}
                compositionWidth={WIDTH}
                compositionHeight={HEIGHT}
                fps={FPS}
                durationInFrames={preset.previewFrames}
                inputProps={{ presetId: preset.id }}
                style={{ width: "100%", height: "100%" }}
                autoPlay
                loop
                controls
                clickToPlay
                acknowledgeRemotionLicense
              />
            </div>

            <div>
              <p className="text-[14px] text-fg-muted">{preset.description}</p>
              {preset.useWhen && <p className="mt-1.5 text-[13px] text-fg-subtle">Когда ставить: {preset.useWhen}</p>}
            </div>

            {onAdd && (
              <Button
                variant={added ? "ghost" : "primary"}
                size="lg"
                onClick={() => {
                  onAdd();
                  onClose();
                }}
              >
                {added ? <Check /> : <Plus />} {added ? "Убрать из промпта" : "Добавить в промпт"}
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
