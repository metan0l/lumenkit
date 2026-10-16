import { createPromptParser, genModels, modelById, TOKEN_RE, type GenSpec, type Segment as CoreSegment } from "@lumenkit/core";
import { presetRegistry } from "@/presets/registry";
import type { PresetDef } from "@/presets/types";

/*
 * Парсер промпта из @lumenkit/core, привязанный к реестру стилей редактора.
 * planGens — эвристика прототипа; на бэкенде её заменит Claude-режиссёр.
 */

export type Segment = CoreSegment<PresetDef>;

export const { presetByName, segments, presetIdsIn, gensIn, genCost, presetToken, togglePresetIn, estimate } =
  createPromptParser(presetRegistry);

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
  const topic = text.replace(TOKEN_RE, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ") || "тема ролика";
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
