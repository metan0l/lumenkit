import { z } from "zod";

/*
 * Конструкторы полей параметров пресета.
 * Каждое поле — zod-схема с метаданными (label, вид контрола). Форма настроек
 * в редакторе строится по этим метаданным автоматически.
 */

export type FieldMeta =
  | { kind: "number"; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: "color"; label: string; swatches: string[] }
  | { kind: "choice"; label: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; label: string }
  | { kind: "text"; label: string };

const SWATCHES = ["#FFFFFF", "#FFD60A", "#3D8BFF", "#FF4D8D", "#34E0A1", "#111111"];

export const num = (label: string, min: number, max: number, def: number, opts: { step?: number; unit?: string } = {}) =>
  z
    .number()
    .min(min)
    .max(max)
    .default(def)
    .meta({ kind: "number", label, min, max, step: opts.step ?? 1, unit: opts.unit } satisfies FieldMeta);

export const color = (label: string, def: string, swatches = SWATCHES) =>
  z.string().default(def).meta({ kind: "color", label, swatches } satisfies FieldMeta);

export const choice = <const T extends readonly [string, ...string[]]>(label: string, options: { [K in T[number]]: string }, values: T, def: T[number]) =>
  z
    .enum(values)
    .default(def as never)
    .meta({ kind: "choice", label, options: values.map((v) => ({ value: v, label: options[v as T[number]] })) } satisfies FieldMeta);

export const toggle = (label: string, def: boolean) => z.boolean().default(def).meta({ kind: "toggle", label } satisfies FieldMeta);

export const text = (label: string, def: string) => z.string().default(def).meta({ kind: "text", label } satisfies FieldMeta);

export function fieldMeta(schema: z.ZodType): FieldMeta | undefined {
  return schema.meta() as FieldMeta | undefined;
}
