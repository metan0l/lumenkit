"use client";

import type { z } from "zod";
import { cn } from "@/lib/cn";
import { fieldMeta } from "@/presets/fields";

/** Форма параметров пресета, сгенерированная из его zod-схемы. */
export function SchemaForm({
  schema,
  value,
  onChange,
}: {
  schema: z.ZodObject;
  value: Record<string, unknown>;
  onChange: (key: string, v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(schema.shape).map(([key, field]) => {
        const meta = fieldMeta(field as z.ZodType);
        if (!meta) return null;
        const v = value[key];
        const label = "mb-1.5 flex justify-between gap-3 text-[13px] text-fg-muted";
        switch (meta.kind) {
          case "number":
            return (
              <label key={key} className="block">
                <span className={label}>
                  {meta.label}
                  <span className="font-medium text-fg tabular-nums">
                    {Number(v).toLocaleString("ru-RU")}
                    {meta.unit}
                  </span>
                </span>
                <input
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={Number(v)}
                  onChange={(e) => onChange(key, Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </label>
            );
          case "choice":
            return (
              <div key={key}>
                <div className={label}>{meta.label}</div>
                <div className="flex rounded-sm bg-surface-2 p-0.5" role="radiogroup" aria-label={meta.label}>
                  {meta.options.map((o) => (
                    <button
                      key={o.value}
                      role="radio"
                      aria-checked={v === o.value}
                      onClick={() => onChange(key, o.value)}
                      className={cn(
                        "h-8 flex-1 rounded-xs px-2 text-[12px] font-medium",
                        v === o.value ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg-muted",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          case "color":
            return (
              <div key={key}>
                <div className={label}>{meta.label}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {meta.swatches.map((c) => (
                    <button
                      key={c}
                      onClick={() => onChange(key, c)}
                      aria-label={`Цвет ${c}`}
                      aria-pressed={String(v).toLowerCase() === c.toLowerCase()}
                      className={cn(
                        "press size-8 rounded-full border border-line-strong",
                        String(v).toLowerCase() === c.toLowerCase() && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                      )}
                      // Цвет пресета — пользовательский контент, а не токен интерфейса
                      style={{ background: c }}
                    />
                  ))}
                  <label className="press relative size-8 overflow-hidden rounded-full border border-dashed border-line-strong" title="Свой цвет">
                    <span className="sr-only">Свой цвет</span>
                    <input type="color" value={String(v)} onChange={(e) => onChange(key, e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                  </label>
                </div>
              </div>
            );
          case "toggle":
            return (
              <button
                key={key}
                role="switch"
                aria-checked={!!v}
                onClick={() => onChange(key, !v)}
                className="flex w-full items-center justify-between text-[13px] text-fg-muted"
              >
                {meta.label}
                <span className={cn("relative h-5 w-9 rounded-full transition-colors duration-150", v ? "bg-accent" : "bg-surface-3")}>
                  <span
                    className="absolute top-0.5 left-0.5 size-4 rounded-full bg-fg transition-transform duration-150 ease-[var(--ease-out)]"
                    style={{ transform: v ? "translateX(16px)" : "none" }}
                  />
                </span>
              </button>
            );
          case "text":
            return (
              <label key={key} className="block">
                <span className={label}>{meta.label}</span>
                <input
                  value={String(v ?? "")}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="h-10 w-full rounded-sm bg-surface-2 px-3 text-[14px] outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            );
        }
      })}
    </div>
  );
}
