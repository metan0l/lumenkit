import { captionPresets } from "./captions";
import { hookPresets, transitionPresets, zoomPresets } from "./motion-presets";
import { generatedPresets } from "./generated";
import { platePresets } from "./plates";
import type { PresetCategory, PresetDef } from "./types";

export const presetRegistry: PresetDef[] = [...captionPresets, ...platePresets, ...zoomPresets, ...transitionPresets, ...hookPresets];

const labels: Record<PresetCategory, string> = {
  captions: "Субтитры",
  plates: "Плашки",
  zooms: "Зумы",
  transitions: "Переходы",
  hooks: "Хуки",
};

export const presetCategories = (Object.keys(labels) as PresetCategory[]).map((id) => ({
  id,
  label: labels[id],
  count: presetRegistry.filter((p) => p.category === id).length,
}));

/** Служебные пресеты (AI-вставки) — не в библиотеке, но доступны композиции */
const allPresets = [...presetRegistry, ...generatedPresets];

export function getPreset(id: string | undefined) {
  return allPresets.find((p) => p.id === id);
}

export function defaultParams(p: PresetDef): Record<string, unknown> {
  return p.schema.parse({}) as Record<string, unknown>;
}

export function resolveParams(p: PresetDef, params?: Record<string, unknown>) {
  return p.schema.parse({ ...defaultParams(p), ...params }) as Record<string, unknown>;
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
