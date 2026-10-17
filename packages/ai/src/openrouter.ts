/*
 * OpenRouter — единый шлюз моделей (решение от 2026-10-17).
 * Это первая реализация адаптеров: вызывающий код знает только про функции пакета,
 * а не про OpenRouter, поэтому прямого провайдера можно подключить без правок снаружи.
 */

export const OPENROUTER_URL = "https://openrouter.ai/api/v1";

export function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY не задан (см. .env.example)");
  return key;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

export async function openrouter(path: string, init: RequestInit & { timeoutMs?: number }) {
  const res = await fetch(`${OPENROUTER_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      // Атрибуция в статистике OpenRouter
      "HTTP-Referer": "https://lumenkit.ai",
      "X-Title": "Lumen Kit",
      ...init.headers,
    },
    signal: AbortSignal.timeout(init.timeoutMs ?? 120_000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ProviderError(`OpenRouter ${path}: ${res.status} ${body.slice(0, 300)}`, res.status, body);
  }
  return res;
}
