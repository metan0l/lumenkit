// Моковые данные прототипа. Медиа — эталонные ролики из корня проекта.
// Проекты, таймлайн и транскрипт уже в БД (демо — packages/db/src/demo.ts); здесь то, что ещё не подключено.
export { trackLabel, type Attachment, type Block, type ChatMessage, type GenSpec, type Track, type Word } from "@lumenkit/core";

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

/** Демо-результаты генераций для прототипа */
export const genResults = {
  image: ["/media/gen/img-22.webp", "/media/gen/img-26.webp", "/media/gen/img-23.webp", "/media/gen/img-27.webp"],
  video: { src: "/media/gen/seedance-bmw.mp4", poster: "/media/gen/img-22.webp" },
};
