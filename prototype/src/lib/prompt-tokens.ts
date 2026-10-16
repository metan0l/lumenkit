import type { GenSpec } from "@/lib/mock";
import { genModels, modelById, type GenModel } from "@/lib/models";
import { presetRegistry as presets } from "@/presets/registry";
import type { PresetDef } from "@/presets/types";

/*
 * Язык промпта: обычный текст + токены в фигурных скобках.
 *   {Удар}                      — стиль-набросок из библиотеки
 *   {Telegram: @danya_kot}      — стиль с текстом (плашки)
 *   {nano-banana: BMW в неоне}  — генерация конкретной моделью (см. lib/models.ts)
 *   {seedance-2.5: дрифт, 5 сек}
 * Порядок токенов = порядок в ролике: «{Вспышка} после этого {Удар}».
 * В авто-режиме Claude может добавить генерации сам — в пределах лимита.
 */

export type Segment =
  | { type: "text"; text: string }
  | { type: "preset"; text: string; preset: PresetDef; arg?: string }
  | { type: "gen"; text: string; model: GenModel; prompt: string };

const RE = /\{([^{}\n]{1,240})\}/g;

/** Стиль по имени: точное совпадение или по последнему слову («Telegram» → «Ссылка на Telegram») */
export function presetByName(name: string) {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return presets.find((p) => p.name.toLowerCase() === q) ?? presets.find((p) => p.name.toLowerCase().endsWith(` ${q}`));
}

export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const [head, ...rest] = m[1].split(":");
    const arg = rest.join(":").trim();
    let seg: Segment | null = null;
    const model = rest.length ? modelById(head) : undefined;
    if (model) seg = { type: "gen", text: m[0], model, prompt: arg };
    else {
      const preset = presetByName(head);
      if (preset) seg = { type: "preset", text: m[0], preset, arg: arg || undefined };
    }
    if (!seg) continue;
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push(seg);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Какие стили упомянуты — по порядку, без повторов */
export function presetIdsIn(text: string) {
  const ids: string[] = [];
  for (const s of segments(text)) if (s.type === "preset" && !ids.includes(s.preset.id)) ids.push(s.preset.id);
  return ids;
}

/** Генерации, указанные вручную (пустые описания не считаем — их ещё пишут) */
export function gensIn(text: string) {
  return segments(text).filter((s): s is Extract<Segment, { type: "gen" }> => s.type === "gen" && s.prompt.length > 0);
}

/** Точная цена ручных генераций */
export function genCost(text: string) {
  return gensIn(text).reduce((sum, g) => sum + g.model.cost, 0);
}

export const presetToken = (id: string) => `{${presets.find((p) => p.id === id)?.name ?? id}}`;

/** Добавить или убрать стиль в конце промпта (кнопка «+» на карточке) */
export function togglePresetIn(text: string, id: string) {
  const token = presetToken(id);
  if (text.includes(token)) return text.replace(token, "").replace(/ {2,}/g, " ").trim();
  return `${text.trimEnd()}${text.trim() ? " " : ""}${token} `;
}

export type PlanOptions = {
  auto: boolean;
  budget: number;
  models: string[];
  /** Фото из вложений — Claude берёт первое как референс */
  refs?: string[];
  /** Правка в чате: генерировать сам, только если просят визуал или дали фото */
  editOnly?: boolean;
};

/*
 * План генераций для режиссёра. В прототипе — эвристика вместо Claude:
 * ручные токены как есть, плюс в авто-режиме кадр и (если хватает лимита) видео.
 */
export function planGens(text: string, opts: PlanOptions): GenSpec[] {
  const slots = [5, 16, 24, 31];
  const stamp = Date.now().toString(36);
  const ref = opts.refs?.[0];
  const manual: GenSpec[] = gensIn(text).map((g, i) => ({
    id: `${stamp}-${i}`,
    kind: g.model.kind,
    model: g.model.id,
    prompt: g.prompt,
    at: slots[i % slots.length],
    len: g.model.kind === "image" ? 3 : 4,
    ref: g.model.acceptsRef ? ref : undefined,
  }));
  if (!opts.auto || !text.trim()) return manual;
  // «Поставь это фото» — просто вставка вложения; генерация — только если просят нарисовать или оживить
  if (opts.editOnly && !/сгенер|нарису|оживи|анимир|видео|картинк|в стиле|b-?roll|визуал/i.test(text)) return manual;

  const allowed = genModels.filter((m) => opts.models.includes(m.id));
  let left = opts.budget - manual.reduce((s, g) => s + (modelById(g.model)?.cost ?? 0), 0);
  const topic = text.replace(RE, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ") || "тема ролика";
  const auto: GenSpec[] = [];

  // Картинка: текст на кадре — GPT Image 2, остальное — Nano Banana
  const wantsText = /текст|надпис|постер|обложк|заголов/i.test(text);
  const img = allowed.find((m) => m.kind === "image" && (wantsText ? m.id === "gpt-image-2" : m.id === "nano-banana")) ?? allowed.find((m) => m.kind === "image");
  // «Оживи фото» — нужен только ролик из этого фото, своя картинка лишняя
  const animateRef = !!ref && /оживи|анимир/i.test(text);
  if (img && !animateRef && left >= img.cost && !manual.some((g) => g.kind === "image")) {
    auto.push({
      id: `${stamp}-a0`,
      kind: "image",
      model: img.id,
      prompt: `Кинематографичный кадр 9:16 к фразе «${topic}», контровой свет, глубина резкости${ref ? ", герой с вашего фото" : ""}`,
      at: 0,
      len: 3,
      auto: true,
      ref: ref && img.acceptsRef ? ref : undefined,
    });
    left -= img.cost;
  }
  // Видео — когда просят динамику или дали фото, которое можно оживить
  const vid = allowed.find((m) => m.kind === "video") ?? undefined;
  const wantsMotion = (!!ref && !opts.editOnly) || /эдит|динами|кинемат|видео|вставк|оживи|анимир/i.test(text);
  if (vid && wantsMotion && left >= vid.cost && !manual.some((g) => g.kind === "video")) {
    auto.push({
      id: `${stamp}-a1`,
      kind: "video",
      model: vid.id,
      prompt: `${ref ? "Оживить ваше фото: " : ""}медленный пролёт камеры, лёгкий туман, 5 сек, без резких склеек`,
      at: 0,
      len: 4,
      auto: true,
      ref: ref && vid.acceptsRef ? ref : undefined,
    });
  }
  return [...manual, ...auto].map((g, i) => ({ ...g, at: slots[i % slots.length] }));
}

/** Сколько может стоить запрос: ручное — точно, авто — «до» лимита */
export function estimate(base: number, text: string, opts: Pick<PlanOptions, "auto" | "budget">) {
  const exact = genCost(text);
  return { base, exact, upTo: opts.auto ? Math.max(exact, opts.budget) : exact };
}

