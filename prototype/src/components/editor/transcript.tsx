"use client";

import { Eraser } from "lucide-react";
import { cn } from "@/lib/cn";
import { words } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useEditor, useTime } from "./store";

// Монтаж через текст: клик — перейти, Delete/Backspace или двойной клик — вырезать слово.
export function Transcript() {
  const ed = useEditor();
  const t = useTime();
  const toast = useToast();
  const fillers = words.filter((w) => w.filler && !ed.deleted.has(w.id));

  const toggle = (id: string) => {
    const removing = !ed.deleted.has(id);
    ed.commit((s) => ({
      ...s,
      deleted: removing ? [...s.deleted, id] : s.deleted.filter((x) => x !== id),
    }));
    if (removing) toast({ text: "Слово вырезано", action: { label: "Отменить", onClick: ed.undo } });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2">
        <p className="text-[12px] text-fg-subtle">Клик — перейти к слову. Двойной клик или Delete — вырезать.</p>
        <Button
          size="sm"
          cost={0}
          disabled={fillers.length === 0}
          onClick={() => {
            ed.commit((s) => ({ ...s, deleted: [...s.deleted, ...fillers.map((f) => f.id)] }));
            toast({ text: `Убрано слов-паразитов: ${fillers.length}`, action: { label: "Отменить", onClick: ed.undo } });
          }}
        >
          <Eraser /> Убрать паразиты{fillers.length > 0 && ` · ${fillers.length}`}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="max-w-[68ch] text-[17px] leading-[1.9]">
          {words.map((w) => {
            const del = ed.deleted.has(w.id);
            const active = t >= w.t && t < w.t + w.d;
            return (
              <span key={w.id}>
                <button
                  onClick={() => ed.seek(w.t + 0.01)}
                  onDoubleClick={() => toggle(w.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Delete" || e.key === "Backspace") {
                      e.preventDefault();
                      toggle(w.id);
                    }
                  }}
                  className={cn(
                    "rounded-[5px] px-[3px] transition-colors duration-100",
                    del && "text-fg-subtle line-through decoration-danger decoration-2",
                    !del && w.filler && "bg-warning/15 text-warning",
                    !del && active && "bg-accent text-accent-fg",
                    !del && !active && !w.filler && "hover:bg-surface-2",
                  )}
                  aria-label={del ? `Вернуть слово «${w.text}»` : w.text}
                >
                  {w.text}
                </button>{" "}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
