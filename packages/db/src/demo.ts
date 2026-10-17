/*
 * Демо-данные для локальной разработки — бывший мок прототипа.
 * Медиа лежат в apps/web/public/media; сид загружает их в S3.
 */
import type { Block, ChatMessage, Word } from "@lumenkit/core";

export const demoBlocks: Block[] = [
  { id: "b-v1", track: "video", start: 0, end: 11.5, label: "Дубль 1" },
  { id: "b-v2", track: "video", start: 11.5, end: 27, label: "Дубль 2" },
  { id: "b-v3", track: "video", start: 27, end: 46, label: "Запись экрана" },
  { id: "b-c1", track: "captions", start: 0, end: 46, label: "Удар", presetId: "udar" },
  { id: "b-h1", track: "plates", start: 0, end: 2.4, label: "Вопрос в лоб", presetId: "vopros", params: { text: "Где брать звуки для монтажа?" } },
  { id: "b-p1", track: "plates", start: 38.5, end: 45, label: "Ссылка на Telegram", presetId: "telegram" },
  { id: "b-z1", track: "zooms", start: 2.7, end: 3.9, label: "Панч", presetId: "punch" },
  { id: "b-z2", track: "zooms", start: 14, end: 15.6, label: "Панч", presetId: "punch" },
  { id: "b-z3", track: "zooms", start: 22.4, end: 24.8, label: "Плавный наезд", presetId: "naezd" },
  { id: "b-t1", track: "transitions", start: 11, end: 12, label: "Вспышка", presetId: "vspyshka" },
  { id: "b-t2", track: "transitions", start: 26.5, end: 27.5, label: "Шторка", presetId: "shtorka" },
  { id: "b-m1", track: "music", start: 0, end: 46, label: "Lo-fi · −18 дБ" },
];

// Транскрипт первого демо-ролика: слова с таймингом (сек)
const raw: [number, string, ("f" | "e")?][] = [
  [0.2, "Я"], [0.4, "уже"], [0.6, "это"], [0.85, "слышал"], [1.3, "и"], [1.5, "думаю"], [1.95, "ну"], [2.2, "такое"],
  [2.6, "Но"], [2.8, "как", "e"], [3.2, "это"], [3.45, "сделать?", "e"], [4.0, "эээ", "f"], [4.6, "Монтаж"], [5.0, "это"],
  [5.2, "не"], [5.35, "только"], [5.7, "визуал,", "e"], [6.2, "но"], [6.4, "и"], [6.55, "звуки", "e"], [7.1, "Поэтому"],
  [7.6, "вот"], [7.8, "вам"], [8.0, "совет", "e"], [8.6, "короче", "f"], [9.1, "все"], [9.3, "звуки"], [9.65, "я"],
  [9.8, "собрал"], [10.15, "в"], [10.3, "одной"], [10.6, "папке"], [11.0, "Risers,"], [11.5, "impacts,"], [12.0, "whooshes"],
  [12.6, "Ссылка"], [13.0, "в"], [13.1, "моём"], [13.35, "Telegram", "e"],
];

export const demoWords: Word[] = raw.map(([t, text, flag], i) => ({
  id: `w${i}`,
  t,
  d: (raw[i + 1]?.[0] ?? t + 0.5) - t,
  text,
  filler: flag === "f",
  emphasis: flag === "e",
}));

export const demoChat: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Собрал черновик: убрал паузы и слово-паразит, поставил субтитры «Удар», хук в начале, три зума на акцентах и плашку со ссылкой в конце.",
    changes: [
      { kind: "remove", label: "Пауза 1,4 с", at: "00:04" },
      { kind: "add", label: "Субтитры «Удар» и хук-вопрос", at: "00:00" },
      { kind: "add", label: "Панч ×2, плавный наезд ×1", at: "00:03" },
      { kind: "add", label: "Плашка «Ссылка на Telegram»", at: "00:38" },
    ],
    state: "applied",
  },
  { id: "m2", role: "user", text: "Сделай субтитры крупнее и акцентные слова синим, как в примере", presets: ["udar"] },
  {
    id: "m3",
    role: "assistant",
    text: "Готово. Размер 88 → 104, акцентный цвет — из бренд-кита.",
    changes: [{ kind: "swap", label: "Субтитры: размер 104, акцент #3D5BFF", at: "00:00" }],
    state: "pending",
  },
];

type DemoProject = {
  slug: string;
  title: string;
  kind: "short" | "insert";
  status: "ready" | "rendering" | "draft" | "processing";
  /** Прогресс активного рендера */
  progress?: number;
  duration: number;
  aspect: "9:16" | "16:9";
  /** Базовое имя файлов в public/media: v2.mp4, v2.webp, v2-preview.mp4… */
  media: string;
  filmstrip?: boolean;
  /** Сколько минут назад обновлён */
  updatedAgo: number;
  /** Таймлайн v1; у первого проекта — demoBlocks */
  blocks: Block[];
};

/** Первый проект — с полным таймлайном, транскриптом и чатом */
export const demoProjects: DemoProject[] = [
  { slug: "zvuki-dlya-montazha", title: "Где брать звуки для монтажа", kind: "short", status: "ready", duration: 46, aspect: "9:16", media: "v2", filmstrip: true, updatedAgo: 12, blocks: demoBlocks },
  { slug: "bmw-v-tumane", title: "BMW в тумане — генерация", kind: "short", status: "rendering", progress: 64, duration: 29, aspect: "9:16", media: "v5", updatedAgo: 0, blocks: [{ id: "b-c1", track: "captions", start: 0, end: 29, label: "Капсула", presetId: "kapsula" }] },
  { slug: "besplatnye-plaginy", title: "Все бесплатные плагины", kind: "short", status: "ready", duration: 41, aspect: "9:16", media: "v3", updatedAgo: 60 * 24, blocks: [{ id: "b-c1", track: "captions", start: 0, end: 41, label: "Неон", presetId: "neon" }] },
  { slug: "razbor-za-10-sekund", title: "Разбор за 10 секунд", kind: "short", status: "draft", duration: 10, aspect: "9:16", media: "v4", updatedAgo: 60 * 48, blocks: [] },
  { slug: "pleylist-slowed", title: "Плейлист slowed — плашка", kind: "insert", status: "ready", duration: 9, aspect: "16:9", media: "v1", updatedAgo: 60 * 72, blocks: [{ id: "b-p1", track: "plates", start: 0, end: 9, label: "Сейчас играет", presetId: "trek" }] },
];
