"use client";

import { useSyncExternalStore } from "react";
import { genModels } from "@lumenkit/core";

/*
 * Настройки AI-режиссёра. По умолчанию — «Авто»: Claude сам решает, где нужны картинки и видео,
 * выбирает модель, пишет промпт и сшивает результат в монтаж, не выходя за лимит.
 * «Вручную» — генерирует только то, что указано токенами {модель: промпт}.
 * Хранится в браузере как удобство (в продукте — в профиле пользователя).
 */

export type AiSettings = {
  auto: boolean;
  /** Сколько кредитов режиссёр может потратить на генерации сам, за один запрос */
  budget: number;
  /** Какие модели режиссёру можно брать */
  models: string[];
};

const KEY = "lumenkit:ai";
const DEFAULTS: AiSettings = { auto: true, budget: 40, models: genModels.map((m) => m.id) };

let state: AiSettings = DEFAULTS;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AiSettings>) };
  } catch {}
}

export function setAiSettings(patch: Partial<AiSettings>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  subs.forEach((f) => f());
}

export function useAiSettings() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => {
      load();
      return state;
    },
    () => DEFAULTS,
  );
}

export function getAiSettings() {
  load();
  return state;
}
