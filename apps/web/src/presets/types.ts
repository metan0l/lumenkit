import type { z } from "zod";

export type PresetCategory = "captions" | "plates" | "zooms" | "transitions" | "hooks";

/** Слово транскрипта во времени ВЫХОДНОГО ролика (сек). */
export type TimedWord = { text: string; start: number; end: number; emphasis?: boolean };

export type DemoBg = "dusk" | "studio" | "city" | "mint" | "paper" | "ember";

type Base<S extends z.ZodObject> = {
  id: string;
  name: string;
  category: PresetCategory;
  tier: "free" | "pro";
  isNew?: boolean;
  description: string;
  schema: S;
  /** Фон превью в библиотеке — свой, сгенерированный кодом */
  demoBg: DemoBg;
  /** Кадр для статичной обложки карточки (при 30 к/с) */
  posterFrame: number;
  /** Длительность превью в кадрах */
  previewFrames: number;
  /** Длительность блока по умолчанию при добавлении на таймлайн (сек) */
  defaultSeconds: number;
  /** Когда режиссёру ставить стиль: «на цифру в речи», «первые 2 сек», «на склейку после паузы» */
  useWhen?: string;
  /** Объём: 3d — Three.js (@remotion/three), рендер заметно дороже; по умолчанию 2d */
  dimension?: PresetDimension;
};

export type PresetDimension = "2d" | "2.5d" | "3d";

export const dimensionLabel: Record<PresetDimension, string> = { "2d": "2D", "2.5d": "2.5D", "3d": "3D" };

export type OverlayProps<P> = {
  params: P;
  /** Слова для субтитров (время относительно начала блока) */
  words: TimedWord[];
  /** Длительность блока в кадрах */
  durationInFrames: number;
};

/** Слой поверх видео: субтитры, плашки, хуки, переходы */
export type OverlayPreset<S extends z.ZodObject = z.ZodObject> = Base<S> & {
  kind: "overlay";
  Component: React.FC<OverlayProps<z.infer<S>>>;
};

/** Обёртка над видео: зумы. Возвращает трансформацию для кадра блока. */
export type WrapperPreset<S extends z.ZodObject = z.ZodObject> = Base<S> & {
  kind: "wrapper";
  transform: (args: { frame: number; durationInFrames: number; fps: number; params: z.infer<S> }) => {
    scale: number;
    x?: number;
    y?: number;
    rotate?: number;
    blur?: number;
  };
};

export type PresetDef = OverlayPreset | WrapperPreset;

export function definePreset<S extends z.ZodObject>(p: OverlayPreset<S> | WrapperPreset<S>): PresetDef {
  return p as unknown as PresetDef;
}
