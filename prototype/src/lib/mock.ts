// Моковые данные прототипа. Медиа — эталонные ролики из корня проекта.

export type ProjectStatus = "ready" | "rendering" | "draft" | "processing";

export type Project = {
  id: string;
  title: string;
  kind: "short" | "insert";
  status: ProjectStatus;
  progress?: number;
  duration: number; // сек
  aspect: "9:16" | "16:9";
  poster: string;
  preview: string;
  src: string;
  updated: string;
  style: string;
  /** Лента кадров (1 кадр/с) и волна звука для таймлайна */
  filmstrip?: string;
  wave?: string;
};

export const projects: Project[] = [
  {
    id: "zvuki-dlya-montazha",
    title: "Где брать звуки для монтажа",
    kind: "short",
    status: "ready",
    duration: 46,
    aspect: "9:16",
    poster: "/media/v2.webp",
    preview: "/media/v2-preview.mp4",
    src: "/media/v2.mp4",
    filmstrip: "/media/v2-filmstrip.jpg",
    wave: "/media/v2-wave.png",
    updated: "12 минут назад",
    style: "Кинетика",
  },
  {
    id: "bmw-v-tumane",
    title: "BMW в тумане — генерация",
    kind: "short",
    status: "rendering",
    progress: 64,
    duration: 29,
    aspect: "9:16",
    poster: "/media/v5.webp",
    preview: "/media/v5-preview.mp4",
    src: "/media/v5.mp4",
    updated: "только что",
    style: "Чистый",
  },
  {
    id: "besplatnye-plaginy",
    title: "Все бесплатные плагины",
    kind: "short",
    status: "ready",
    duration: 41,
    aspect: "9:16",
    poster: "/media/v3.webp",
    preview: "/media/v3-preview.mp4",
    src: "/media/v3.mp4",
    updated: "вчера",
    style: "Неон",
  },
  {
    id: "razbor-za-10-sekund",
    title: "Разбор за 10 секунд",
    kind: "short",
    status: "draft",
    duration: 10,
    aspect: "9:16",
    poster: "/media/v4.webp",
    preview: "/media/v4-preview.mp4",
    src: "/media/v4.mp4",
    updated: "2 дня назад",
    style: "Без стиля",
  },
  {
    id: "pleylist-slowed",
    title: "Плейлист slowed — плашка",
    kind: "insert",
    status: "ready",
    duration: 9,
    aspect: "16:9",
    poster: "/media/v1.webp",
    preview: "/media/v1-preview.mp4",
    src: "/media/v1.mp4",
    updated: "3 дня назад",
    style: "Список треков",
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  ready: "Готово",
  rendering: "Рендер",
  draft: "Черновик",
  processing: "Распознаём речь",
};

// Пресеты — Remotion-компоненты в src/presets (реестр импортируют только клиентские компоненты).

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

export const blocks: Block[] = [
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

// Транскрипт: слова с таймингом (сек). Удалённые слова вырезаются из монтажа.
export type Word = { id: string; t: number; d: number; text: string; filler?: boolean; emphasis?: boolean };

const raw: [number, string, ("f" | "e")?][] = [
  [0.2, "Я"], [0.4, "уже"], [0.6, "это"], [0.85, "слышал"], [1.3, "и"], [1.5, "думаю"], [1.95, "ну"], [2.2, "такое"],
  [2.6, "Но"], [2.8, "как", "e"], [3.2, "это"], [3.45, "сделать?", "e"], [4.0, "эээ", "f"], [4.6, "Монтаж"], [5.0, "это"],
  [5.2, "не"], [5.35, "только"], [5.7, "визуал,", "e"], [6.2, "но"], [6.4, "и"], [6.55, "звуки", "e"], [7.1, "Поэтому"],
  [7.6, "вот"], [7.8, "вам"], [8.0, "совет", "e"], [8.6, "короче", "f"], [9.1, "все"], [9.3, "звуки"], [9.65, "я"],
  [9.8, "собрал"], [10.15, "в"], [10.3, "одной"], [10.6, "папке"], [11.0, "Risers,"], [11.5, "impacts,"], [12.0, "whooshes"],
  [12.6, "Ссылка"], [13.0, "в"], [13.1, "моём"], [13.35, "Telegram", "e"],
];

export const words: Word[] = raw.map(([t, text, flag], i) => ({
  id: `w${i}`,
  t,
  d: (raw[i + 1]?.[0] ?? t + 0.5) - t,
  text,
  filler: flag === "f",
  emphasis: flag === "e",
}));

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

export const initialChat: ChatMessage[] = [
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

export const suggestions = [
  "Убери все паузы длиннее 0,5 с",
  "Добавь хук в первые 2 секунды",
  "Музыку тише под голос",
  "Замени переходы на шторку",
];

export type InsertJob = {
  id: string;
  prompt: string;
  status: "queued" | "generating" | "ready" | "failed";
  error?: string;
  progress?: number;
  format: string;
  alpha: boolean;
  duration: number;
  poster?: string;
  preview?: string;
  presetId?: string;
  cost: number;
};

export const insertJobs: InsertJob[] = [
  { id: "i0", prompt: "Логотип канала собирается из частиц и взрывается конфетти", status: "failed", error: "Модель картинок не справилась за 3 попытки: в промпте слишком много действий в одной сцене.", format: "WebM", alpha: true, duration: 4, presetId: "podpishis", cost: 8 },
  { id: "i1", prompt: "Плашка «Сейчас играет» со списком из трёх треков, тёмная, мягкая тень", status: "ready", format: "ProRes 4444", alpha: true, duration: 9, poster: "/media/v1.webp", preview: "/media/v1-preview.mp4", cost: 4 },
  { id: "i2", prompt: "Иконка Telegram выезжает снизу, подпись «в своём тгк оставил все звуки»", status: "generating", progress: 42, format: "WebM", alpha: true, duration: 4, presetId: "telegram", cost: 3 },
  { id: "i3", prompt: "Счётчик подписчиков 0 → 100 000, крупные цифры", status: "queued", format: "MP4", alpha: false, duration: 5, presetId: "schetchik", cost: 3 },
  { id: "i4", prompt: "Кнопка «Подписаться», курсор нажимает, прозрачный фон", status: "ready", format: "WebM", alpha: true, duration: 3, presetId: "podpishis", cost: 3 },
];

export const credits = { balance: 240, plan: "Креатор", monthly: 600, renewsOn: "1 ноября" };

export const costs = {
  autoEdit: 12,
  chatEdit: 1,
  insert: 3,
  insertAi: 8,
  render: 0,
};

/** Вложение к сообщению — как в Claude: фото, ролик, файл */
export type Attachment = { id: string; name: string; url: string; kind: "image" | "video" | "file" };

/** Генерация внутри ответа режиссёра (модель — из lib/models.ts) */
export type GenSpec = {
  id: string;
  kind: "image" | "video";
  /** id из lib/models.ts */
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

/** Демо-результаты генераций для прототипа */
export const genResults = {
  image: ["/media/gen/img-22.webp", "/media/gen/img-26.webp", "/media/gen/img-23.webp", "/media/gen/img-27.webp"],
  video: { src: "/media/gen/seedance-bmw.mp4", poster: "/media/gen/img-22.webp" },
};
