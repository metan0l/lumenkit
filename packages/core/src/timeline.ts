/*
 * Модель монтажа — общий контракт для редактора (браузер), API и воркеров.
 * Время везде в секундах исходного ролика, если не сказано иное.
 */

export type Track = "video" | "captions" | "plates" | "zooms" | "transitions" | "media" | "music";

export const trackLabel: Record<Track, string> = {
  video: "Видео",
  captions: "Субтитры",
  plates: "Плашки",
  zooms: "Зумы",
  transitions: "Переходы",
  media: "AI-вставки",
  music: "Музыка",
};

export type Block = {
  id: string;
  track: Track;
  start: number;
  end: number;
  label: string;
  presetId?: string;
  params?: Record<string, unknown>;
};

// Транскрипт: слова с таймингом (сек). Удалённые слова вырезаются из монтажа.
export type Word = { id: string; t: number; d: number; text: string; filler?: boolean; emphasis?: boolean };

/** Вложение к сообщению — как в Claude: фото, ролик, файл */
export type Attachment = { id: string; name: string; url: string; kind: "image" | "video" | "file" };

/** Генерация внутри ответа режиссёра (модель — из реестра models.ts) */
export type GenSpec = {
  id: string;
  kind: "image" | "video";
  /** id из реестра моделей */
  model: string;
  prompt: string;
  /** Claude решил и написал промпт сам (авто-режим) */
  auto?: boolean;
  /** Фото-референс из вложений */
  ref?: string;
  /** Куда Claude поставит результат (сек) */
  at: number;
  len: number;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string; presets?: string[]; files?: Attachment[] }
  | {
      id: string;
      role: "assistant";
      text: string;
      changes?: { kind: "add" | "swap" | "remove"; label: string; at: string }[];
      gens?: GenSpec[];
      state?: "pending" | "applied" | "reverted";
    };
