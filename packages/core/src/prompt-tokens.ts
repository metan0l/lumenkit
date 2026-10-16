import { modelById, type GenModel } from "./models";

/*
 * Язык промпта: обычный текст + токены в фигурных скобках.
 *   {Удар}                      — стиль-набросок из библиотеки
 *   {Telegram: @danya_kot}      — стиль с текстом (плашки)
 *   {nano-banana: BMW в неоне}  — генерация конкретной моделью (см. models.ts)
 *   {seedance-2.5: дрифт, 5 сек}
 * Порядок токенов = порядок в ролике: «{Вспышка} после этого {Удар}».
 *
 * Парсер не знает про React-компоненты пресетов: каталог стилей передаётся снаружи,
 * поэтому один и тот же код работает в редакторе и в воркере режиссёра.
 */

/** Минимум, который парсеру нужно знать о стиле */
export type PresetRef = { id: string; name: string };

export type Segment<P extends PresetRef = PresetRef> =
  | { type: "text"; text: string }
  | { type: "preset"; text: string; preset: P; arg?: string }
  | { type: "gen"; text: string; model: GenModel; prompt: string };

export const TOKEN_RE = /\{([^{}\n]{1,240})\}/g;

export function createPromptParser<P extends PresetRef>(presets: readonly P[]) {
  /** Стиль по имени: точное совпадение или по последнему слову («Telegram» → «Ссылка на Telegram») */
  function presetByName(name: string) {
    const q = name.trim().toLowerCase();
    if (!q) return undefined;
    return presets.find((p) => p.name.toLowerCase() === q) ?? presets.find((p) => p.name.toLowerCase().endsWith(` ${q}`));
  }

  function segments(text: string): Segment<P>[] {
    const out: Segment<P>[] = [];
    let last = 0;
    for (const m of text.matchAll(TOKEN_RE)) {
      const [head, ...rest] = m[1].split(":");
      const arg = rest.join(":").trim();
      let seg: Segment<P> | null = null;
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
  function presetIdsIn(text: string) {
    const ids: string[] = [];
    for (const s of segments(text)) if (s.type === "preset" && !ids.includes(s.preset.id)) ids.push(s.preset.id);
    return ids;
  }

  /** Генерации, указанные вручную (пустые описания не считаем — их ещё пишут) */
  function gensIn(text: string) {
    return segments(text).filter((s): s is Extract<Segment<P>, { type: "gen" }> => s.type === "gen" && s.prompt.length > 0);
  }

  /** Точная цена ручных генераций */
  function genCost(text: string) {
    return gensIn(text).reduce((sum, g) => sum + g.model.cost, 0);
  }

  const presetToken = (id: string) => `{${presets.find((p) => p.id === id)?.name ?? id}}`;

  /** Добавить или убрать стиль в конце промпта (кнопка «+» на карточке) */
  function togglePresetIn(text: string, id: string) {
    const token = presetToken(id);
    if (text.includes(token)) return text.replace(token, "").replace(/ {2,}/g, " ").trim();
    return `${text.trimEnd()}${text.trim() ? " " : ""}${token} `;
  }

  /** Сколько может стоить запрос: ручное — точно, авто — «до» лимита */
  function estimate(base: number, text: string, opts: { auto: boolean; budget: number }) {
    const exact = genCost(text);
    return { base, exact, upTo: opts.auto ? Math.max(exact, opts.budget) : exact };
  }

  return { presetByName, segments, presetIdsIn, gensIn, genCost, presetToken, togglePresetIn, estimate };
}
