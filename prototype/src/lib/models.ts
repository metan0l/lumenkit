/*
 * Реестр генеративных моделей. Новая модель — одна запись здесь:
 * она сразу появится в меню «+», подсветке токена {id: промпт}, цене и выборе AI-режиссёра.
 * Сами вызовы — только через адаптеры провайдеров на бэкенде (ImageProvider / VideoProvider).
 */

export type GenKind = "image" | "video";

export type GenModel = {
  /** Как пишется в токене: {nano-banana: …} */
  id: string;
  label: string;
  kind: GenKind;
  provider: string;
  /** Кредитов за одну генерацию */
  cost: number;
  /** Чем модель сильна — подсказка в меню и подсказка Claude при авто-выборе */
  strength: string;
  /** Принимает фото-референс из вложений */
  acceptsRef: boolean;
};

export const genModels: GenModel[] = [
  {
    id: "nano-banana",
    label: "Nano Banana",
    kind: "image",
    provider: "Google",
    cost: 4,
    strength: "Быстро, держит лицо и стиль по референсу",
    acceptsRef: true,
  },
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    kind: "image",
    provider: "OpenAI",
    cost: 6,
    strength: "Точный текст на картинке, постеры и обложки",
    acceptsRef: true,
  },
  {
    id: "seedance-2.5",
    label: "Seedance 2.5",
    kind: "video",
    provider: "ByteDance",
    cost: 20,
    strength: "Видео 5 сек: оживит кадр или сцену",
    acceptsRef: true,
  },
];

/** «seedance2.5», «Seedance 2.5», «seedance-2.5» — одна и та же модель */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function modelById(id: string) {
  const q = norm(id);
  return q ? genModels.find((m) => norm(m.id) === q || norm(m.label) === q) : undefined;
}

/** Модель по умолчанию для вида генерации — её берёт режиссёр в авто-режиме */
export const defaultModel = (kind: GenKind) => genModels.find((m) => m.kind === kind)!;
