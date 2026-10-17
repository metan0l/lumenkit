import type { Word } from "@lumenkit/core";
import { openrouter, ProviderError } from "./openrouter";

/*
 * Расшифровка речи со временем каждого слова — основа «монтажа через текст».
 * Scribe v2: точный русский, ~2,5 с на минуту речи. Whisper large v3 — запасной.
 * Ограничения OpenRouter: файл до 25 МБ и ~60 с на запрос, поэтому шлём сжатую моно-дорожку.
 */
export const STT_MODELS = ["elevenlabs/scribe-v2", "openai/whisper-large-v3"] as const;

export type Transcript = {
  words: Word[];
  language?: string;
  model: string;
  /** Для usage_log */
  usage: { seconds: number; costUsd: number; durationMs: number };
};

type SttWord = { word: string; start: number; end: number };
type SttResponse = { text: string; language?: string; words?: SttWord[]; usage?: { seconds?: number; cost?: number } };

/** Явные слова-паразиты (редактор вырезает их одной кнопкой). Спорные — «ну», «вот» — оставляем режиссёру: он видит контекст. */
const FILLERS = new Set(["э", "ээ", "эээ", "эм", "мм", "ммм", "короче", "типа"]);
const bare = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export function toWords(stt: SttWord[]): Word[] {
  return stt
    .map((w) => ({ ...w, word: w.word.trim() }))
    .filter((w) => w.word && bare(w.word))
    .map((w, i) => ({
      id: `w${i}`,
      t: round(w.start),
      d: round(Math.max(0.05, w.end - w.start)),
      text: w.word,
      filler: FILLERS.has(bare(w.word)) || undefined,
    }));
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export async function transcribe(
  audio: Uint8Array,
  opts: { fileName: string; mime: string; language?: string },
): Promise<Transcript> {
  let lastError: unknown;
  for (const model of STT_MODELS) {
    const form = new FormData();
    form.append("file", new Blob([audio], { type: opts.mime }), opts.fileName);
    form.append("model", model);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    if (opts.language) form.append("language", opts.language);

    const started = Date.now();
    try {
      const res = await openrouter("/audio/transcriptions", { method: "POST", body: form, timeoutMs: 90_000 });
      const data = (await res.json()) as SttResponse;
      if (!data.words?.length) throw new Error(`${model}: нет слов в ответе`);
      return {
        words: toWords(data.words),
        language: data.language,
        model,
        usage: { seconds: data.usage?.seconds ?? 0, costUsd: data.usage?.cost ?? 0, durationMs: Date.now() - started },
      };
    } catch (e) {
      lastError = e;
      // Ошибку запроса (4xx, кроме лимитов) запасная модель не исправит
      if (e instanceof ProviderError && e.status >= 400 && e.status < 500 && e.status !== 429) throw e;
    }
  }
  throw lastError;
}
