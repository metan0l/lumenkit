"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formats = [
  { id: "mp4-30", title: "MP4 · 1080p · 30 к/с", hint: "Для TikTok, Reels и Shorts" },
  { id: "mp4-60", title: "MP4 · 1080p · 60 к/с", hint: "Плавнее на быстрых сценах" },
  { id: "mp4-4k", title: "MP4 · 4K · 30 к/с", hint: "Если будете доделывать в другом редакторе", pro: true },
];

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fmt, setFmt] = useState("mp4-30");
  const [phase, setPhase] = useState<"pick" | "render" | "done">("pick");
  const [p, setP] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase("pick");
      setP(0);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "render") return;
    const t = setInterval(() => setP((v) => (v >= 100 ? 100 : v + 4)), 90);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (p >= 100 && phase === "render") setPhase("done");
  }, [p, phase]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-bg/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Экспорт"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={springs.ui}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:inset-auto md:top-1/2 md:left-1/2 md:w-[480px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-medium">Экспорт</h2>
              <button onClick={onClose} className="press grid size-8 place-items-center rounded-sm text-fg-subtle hover:bg-surface-2 hover:text-fg" aria-label="Закрыть">
                <X className="size-4" />
              </button>
            </div>

            {phase === "pick" && (
              <>
                <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Формат">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      role="radio"
                      aria-checked={fmt === f.id}
                      onClick={() => setFmt(f.id)}
                      className={cn("press flex items-center gap-3 rounded-md p-3 text-left", fmt === f.id ? "bg-surface-2 ring-1 ring-fg" : "bg-surface-2 hover:bg-surface-3")}
                    >
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", fmt === f.id ? "border-accent bg-accent" : "border-line-strong")}>
                        {fmt === f.id && <Check className="size-3 text-accent-fg" strokeWidth={3} />}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5 text-[14px] font-medium">
                          {f.title} {f.pro && <Badge tone="pro">PRO</Badge>}
                        </span>
                        <span className="block text-[12px] text-fg-muted">{f.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[13px] text-fg-muted">Рендер и скачивание бесплатны. Водяного знака нет.</p>
                <Button variant="primary" size="lg" cost={0} className="mt-4 w-full justify-center" onClick={() => setPhase("render")}>
                  Рендерить
                </Button>
              </>
            )}

            {phase !== "pick" && (
              <div className="mt-6" aria-live="polite">
                <div className="flex justify-between text-[14px]">
                  <span>{phase === "done" ? "Готово" : "Рендерим на сервере"}</span>
                  <span className="tabular-nums">{p}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full origin-left rounded-full bg-accent transition-transform duration-100" style={{ transform: `scaleX(${p / 100})` }} />
                </div>
                <p className="mt-3 text-[13px] text-fg-muted">
                  {phase === "done" ? "Файл сохранён в проекте — скачать можно в любой момент." : "Можно закрыть окно — пришлём уведомление, когда будет готово."}
                </p>
                <Button variant="primary" size="lg" className="mt-5 w-full justify-center" disabled={phase !== "done"} onClick={onClose}>
                  <Download /> Скачать MP4
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
