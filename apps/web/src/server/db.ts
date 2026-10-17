import "server-only";
import { createDb, DEV_USER_ID, type Db } from "@lumenkit/db";

// Один пул соединений на процесс; в dev переживает горячую перезагрузку модулей
const g = globalThis as unknown as { lumenkitDb?: Db };
export const db = (g.lumenkitDb ??= createDb());

/** Текущий пользователь. Пока нет авторизации — тестовый из сида; потом здесь будет сессия Better Auth. */
export async function currentUserId() {
  return DEV_USER_ID;
}
